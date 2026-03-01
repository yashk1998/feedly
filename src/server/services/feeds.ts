import axios, { AxiosRequestConfig } from 'axios'
import FeedParser from 'feedparser'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getRedis } from '@/lib/redis'

interface ParsedFeed {
  title: string
  siteUrl: string
  articles: ParsedArticle[]
}

interface ParsedArticle {
  guid: string
  title: string
  url: string
  publishedAt: Date
  author?: string
  summary: string
  content: string
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function getBrowserHeaders(url: string): Record<string, string> {
  const urlObj = new URL(url)
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'Referer': `${urlObj.protocol}//${urlObj.host}/`,
  }
}

function cleanHtmlContent(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

function isContentSubstantial(content: string | null | undefined): boolean {
  if (!content) return false
  const textContent = content.replace(/<[^>]*>/g, '').trim()
  return textContent.length > 500
}

export class FeedService {
  async fetchFullArticleContent(url: string): Promise<{ content: string; excerpt: string } | null> {
    const strategies = [
      { name: 'chrome', headers: getBrowserHeaders(url) },
      { name: 'firefox', headers: { ...getBrowserHeaders(url), 'User-Agent': USER_AGENTS[2] } },
      { name: 'safari', headers: { ...getBrowserHeaders(url), 'User-Agent': USER_AGENTS[3] } },
    ]

    for (const strategy of strategies) {
      try {
        logger.debug(`Trying ${strategy.name} strategy for ${url}`)

        const config: AxiosRequestConfig = {
          timeout: 20000,
          headers: strategy.headers,
          maxRedirects: 5,
          validateStatus: (status) => status < 400,
          decompress: true,
        }

        const response = await axios.get(url, config)

        if (!response.data || typeof response.data !== 'string') {
          continue
        }

        const dom = new JSDOM(response.data, { url })
        const reader = new Readability(dom.window.document, {
          charThreshold: 100,
        })
        const article = reader.parse()

        if (article && article.content && isContentSubstantial(article.content)) {
          logger.info(`Successfully extracted content from ${url} using ${strategy.name}`)
          return {
            content: cleanHtmlContent(article.content),
            excerpt: article.excerpt || '',
          }
        }
      } catch (error) {
        const errorMsg = (error as Error).message
        logger.debug(`Strategy ${strategy.name} failed for ${url}: ${errorMsg}`)
      }
    }

    logger.warn(`All extraction strategies failed for ${url}`)
    return null
  }

  async getOrCreateFeed(url: string) {
    let feed = await prisma.feed.findUnique({ where: { url } })

    if (!feed) {
      const feedData = await this.parseFeed(url)
      feed = await prisma.feed.create({
        data: {
          url,
          title: feedData.title,
          siteUrl: feedData.siteUrl,
          lastFetchedAt: new Date(),
        },
      })
      await this.storeArticles(feed.id, feedData.articles, false)
    }

    return feed
  }

  async parseFeed(url: string): Promise<ParsedFeed> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
      })

      return new Promise((resolve, reject) => {
        const feedparser = new FeedParser({ addmeta: true })
        const articles: ParsedArticle[] = []
        let feedMeta: any = {}

        feedparser.on('error', reject)
        feedparser.on('meta', (meta: any) => { feedMeta = meta })

        feedparser.on('readable', function (this: any) {
          let item = this.read()
          while (item) {
            const contentEncoded =
              item['content:encoded']?.['#'] ||
              item['content:encoded'] ||
              (item['content'] && item['content']['#']) ||
              ''

            const description = item.description || ''
            const itemSummary = item.summary || ''

            let fullContent = ''
            let summary = ''

            if (contentEncoded && contentEncoded.length > 200) {
              fullContent = cleanHtmlContent(contentEncoded)
              summary = itemSummary || description.substring(0, 500)
            } else if (description && description.length > itemSummary.length) {
              fullContent = cleanHtmlContent(description)
              summary = itemSummary || description.substring(0, 300)
            } else {
              fullContent = cleanHtmlContent(itemSummary || description)
              summary = description || itemSummary
            }

            articles.push({
              guid: item.guid || item.link || crypto.randomUUID(),
              title: item.title || 'Untitled',
              url: item.link || item.origlink || '',
              publishedAt: item.date || item.pubdate || new Date(),
              author: item.author || item['dc:creator']?.['#'] || item['dc:creator'] || undefined,
              summary: summary.substring(0, 1000),
              content: fullContent,
            })
            item = this.read()
          }
        })

        feedparser.on('end', () => {
          resolve({
            title: feedMeta.title || 'Unknown Feed',
            siteUrl: feedMeta.link || url,
            articles,
          })
        })

        feedparser.write(response.data)
        feedparser.end()
      })
    } catch (error) {
      logger.error(`Failed to parse feed ${url}:`, error)
      try {
        return await this.scrapeWebsite(url)
      } catch (scrapeError) {
        logger.error(`Failed to scrape website ${url}:`, scrapeError)
        throw new Error(`Unable to parse feed or scrape website: ${url}`)
      }
    }
  }

  async scrapeWebsite(url: string): Promise<ParsedFeed> {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: getBrowserHeaders(url),
    })

    const dom = new JSDOM(response.data, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) {
      throw new Error('Unable to extract content from website')
    }

    return {
      title: article.title || 'Scraped Content',
      siteUrl: url,
      articles: [{
        guid: crypto.createHash('md5').update(url + Date.now()).digest('hex'),
        title: article.title || 'Untitled',
        url,
        publishedAt: new Date(),
        author: article.byline || undefined,
        summary: article.excerpt || '',
        content: cleanHtmlContent(article.content || ''),
      }],
    }
  }

  async storeArticles(feedId: bigint, articles: ParsedArticle[], fetchFullContent: boolean = false): Promise<bigint[]> {
    const newArticleIds: bigint[] = []

    for (const article of articles) {
      const checksum = crypto
        .createHash('sha256')
        .update(article.url || article.title + article.guid)
        .digest('hex')

      const existingArticle = await prisma.article.findFirst({
        where: { checksum },
      })

      if (existingArticle) continue

      let fullContent = article.content
      let summary = article.summary

      if (fetchFullContent && article.url && !isContentSubstantial(fullContent)) {
        const extracted = await this.fetchFullArticleContent(article.url)
        if (extracted && isContentSubstantial(extracted.content)) {
          fullContent = extracted.content
          if (!summary || summary.length < 50) {
            summary = extracted.excerpt || summary
          }
        }
      }

      try {
        const created = await prisma.article.create({
          data: {
            feedId,
            guid: article.guid,
            title: article.title,
            url: article.url,
            publishedAt: article.publishedAt,
            author: article.author,
            summaryHtml: summary,
            contentHtml: fullContent,
            checksum,
          },
        })
        newArticleIds.push(created.id)
      } catch (error) {
        if ((error as any).code === 'P2002') continue
        throw error
      }
    }

    return newArticleIds
  }

  async refreshFeed(feedId: number): Promise<bigint[]> {
    const feedIdBigInt = BigInt(feedId)
    const feed = await prisma.feed.findUnique({ where: { id: feedIdBigInt } })

    if (!feed) throw new Error(`Feed ${feedId} not found`)

    try {
      const feedData = await this.parseFeed(feed.url)

      await prisma.feed.update({
        where: { id: feedIdBigInt },
        data: {
          title: feedData.title,
          siteUrl: feedData.siteUrl,
          lastFetchedAt: new Date(),
        },
      })

      const newArticleIds = await this.storeArticles(feedIdBigInt, feedData.articles, false)

      try {
        const redis = await getRedis()
        await redis.setEx(`feed:${feedId}:refreshed`, 3600, Date.now().toString())
      } catch {
        // Redis optional
      }

      logger.info(`Successfully refreshed feed ${feedId} (${feed.url}) — ${newArticleIds.length} new articles`)
      return newArticleIds
    } catch (error) {
      logger.error(`Failed to refresh feed ${feedId}:`, error)
      throw error
    }
  }

  async getFeedsToRefresh(planType: 'free' | 'paid'): Promise<number[]> {
    const defaultInterval = planType === 'free' ? 360 : 60
    const now = Date.now()

    // Fetch all feeds with subscriptions, using per-feed AutoTTL when available
    const feeds = await prisma.feed.findMany({
      where: {
        subscriptions: { some: {} },
      },
      select: { id: true, lastFetchedAt: true, autoTtlMinutes: true },
    })

    return feeds
      .filter((f) => {
        if (!f.lastFetchedAt) return true // Never fetched
        const ttl = f.autoTtlMinutes ?? defaultInterval
        const cutoff = now - ttl * 60 * 1000
        return f.lastFetchedAt.getTime() < cutoff
      })
      .map((f) => Number(f.id))
  }

  /**
   * Detect the best view type for a feed based on its articles.
   * Analyzes the first N articles to determine content characteristics.
   */
  async detectViewType(feedId: bigint): Promise<string> {
    const articles = await prisma.article.findMany({
      where: { feedId },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: {
        title: true,
        url: true,
        summaryHtml: true,
        contentHtml: true,
      },
    })

    if (articles.length === 0) return 'article'

    let shortPostCount = 0  // posts with <280 chars of text
    let imageCount = 0      // posts with images
    let videoCount = 0      // YouTube/Vimeo/video embeds
    let noTitleCount = 0    // posts with no or minimal title
    let alertCount = 0      // GitHub-style notifications

    for (const a of articles) {
      const text = (a.contentHtml || a.summaryHtml || '').replace(/<[^>]*>/g, '').trim()
      const html = a.contentHtml || a.summaryHtml || ''
      const url = a.url || ''

      // Short posts (social-style)
      if (text.length < 280) shortPostCount++
      if (!a.title || a.title.length < 10) noTitleCount++

      // Image detection
      const imgRegex = /<img\s/gi
      const imgMatches = html.match(imgRegex)
      if (imgMatches && imgMatches.length > 0) imageCount++

      // Video detection
      if (
        url.includes('youtube.com') || url.includes('youtu.be') ||
        url.includes('vimeo.com') ||
        html.includes('<iframe') || html.includes('video')
      ) {
        videoCount++
      }

      // Notification/alert detection (GitHub, CI/CD)
      if (
        url.includes('github.com') ||
        (a.title && /^([\w-]+\/[\w-]+)/.test(a.title)) ||
        (a.title && /(merged|closed|opened|released|deployed)/i.test(a.title))
      ) {
        alertCount++
      }
    }

    const total = articles.length
    const threshold = 0.5 // >50% of articles match

    // Priority: video > picture > social > notification > article
    if (videoCount / total > threshold) return 'video'
    if (imageCount / total > threshold && shortPostCount / total < 0.3) return 'picture'
    if (shortPostCount / total > threshold || noTitleCount / total > threshold) return 'social'
    if (alertCount / total > threshold) return 'notification'

    return 'article'
  }
}

export const feedService = new FeedService()
