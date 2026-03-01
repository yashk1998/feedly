import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface ActionConfig {
  keywords?: string[]
  webhookUrl?: string
  targetLang?: string
  tagId?: number
}

/**
 * Execute feed actions for newly fetched articles.
 * Called after each feed refresh during cron sync.
 */
export async function executeActions(feedId: bigint, newArticleIds: bigint[]): Promise<void> {
  if (newArticleIds.length === 0) return

  // Get all enabled actions for this feed
  const actions = await prisma.feedAction.findMany({
    where: { feedId, isEnabled: true },
  })

  if (actions.length === 0) return

  // Load the new articles
  const articles = await prisma.article.findMany({
    where: { id: { in: newArticleIds } },
    select: {
      id: true,
      title: true,
      url: true,
      author: true,
      summaryHtml: true,
      contentHtml: true,
    },
  })

  for (const action of actions) {
    const config = action.config as ActionConfig
    const userId = action.userId

    try {
      switch (action.type) {
        case 'silence':
          // Auto-mark all new articles as read
          await prisma.articleRead.createMany({
            data: articles.map((a) => ({
              articleId: a.id,
              userId,
            })),
            skipDuplicates: true,
          })
          logger.debug(`Silence action: marked ${articles.length} articles as read for feed ${feedId}`)
          break

        case 'notify': {
          // Check if any article matches keywords
          const keywords = config.keywords || []
          if (keywords.length === 0) break

          const matching = articles.filter((a) => {
            const text = `${a.title || ''} ${(a.summaryHtml || '').replace(/<[^>]*>/g, '')}`.toLowerCase()
            return keywords.some((kw) => text.includes(kw.toLowerCase()))
          })

          if (matching.length > 0) {
            // Store notifications (could be enhanced with push notifications later)
            logger.info(`Notify action: ${matching.length} articles matched keywords [${keywords.join(', ')}] in feed ${feedId}`)
            // For now, we use webhook for notification delivery
            if (config.webhookUrl) {
              await sendWebhook(config.webhookUrl, {
                type: 'keyword_match',
                feedId: Number(feedId),
                keywords,
                articles: matching.map((a) => ({
                  id: Number(a.id),
                  title: a.title,
                  url: a.url,
                })),
              })
            }
          }
          break
        }

        case 'tag': {
          // Auto-tag articles (optionally filtered by keywords)
          const tagId = config.tagId
          if (!tagId) break

          const keywords = config.keywords || []
          const toTag = keywords.length > 0
            ? articles.filter((a) => {
                const text = `${a.title || ''} ${(a.summaryHtml || '').replace(/<[^>]*>/g, '')}`.toLowerCase()
                return keywords.some((kw) => text.includes(kw.toLowerCase()))
              })
            : articles

          if (toTag.length > 0) {
            await prisma.articleTag.createMany({
              data: toTag.map((a) => ({
                articleId: a.id,
                tagId: BigInt(tagId),
              })),
              skipDuplicates: true,
            })
            logger.debug(`Tag action: tagged ${toTag.length} articles with tag ${tagId}`)
          }
          break
        }

        case 'webhook': {
          // Forward articles to external webhook
          const webhookUrl = config.webhookUrl
          if (!webhookUrl) break

          await sendWebhook(webhookUrl, {
            type: 'new_articles',
            feedId: Number(feedId),
            articles: articles.map((a) => ({
              id: Number(a.id),
              title: a.title,
              url: a.url,
              author: a.author,
              summary: (a.summaryHtml || '').replace(/<[^>]*>/g, '').slice(0, 500),
            })),
          })
          logger.debug(`Webhook action: forwarded ${articles.length} articles to ${webhookUrl}`)
          break
        }

        case 'translate':
          // Translation is handled on-demand in the article reader
          // This action flag just marks the feed for auto-translate
          // The article reader checks for this flag and auto-triggers translation
          break
      }
    } catch (error) {
      logger.warn(`Action ${action.type} failed for feed ${feedId}:`, error)
    }
  }
}

/**
 * Validate a webhook URL to prevent SSRF attacks.
 * Blocks private/reserved IP ranges and non-HTTPS URLs.
 */
function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow HTTPS webhooks
    if (parsed.protocol !== 'https:') return false

    // Block localhost and common private hostnames
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false
    }

    // Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
    const parts = hostname.split('.').map(Number)
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      if (parts[0] === 10) return false
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false
      if (parts[0] === 192 && parts[1] === 168) return false
      if (parts[0] === 169 && parts[1] === 254) return false
      if (parts[0] === 0) return false
    }

    return true
  } catch {
    return false
  }
}

async function sendWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
  if (!isAllowedWebhookUrl(url)) {
    logger.warn(`Blocked webhook to disallowed URL: ${url}`)
    return
  }

  try {
    await axios.post(url, {
      ...payload,
      source: 'syncd',
      timestamp: new Date().toISOString(),
    }, {
      timeout: 10000,
      maxRedirects: 0,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    logger.warn(`Webhook delivery failed to ${url}:`, error)
  }
}
