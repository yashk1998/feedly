import { NextRequest, NextResponse } from 'next/server'
import { feedService } from '@/server/services/feeds'
import { aiService } from '@/server/services/ai'
import { generateMissingEmbeddings, generateTopicClusters } from '@/server/services/clustering'
import { executeActions } from '@/server/services/actions'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    logger.info('Starting scheduled feed sync...')

    const feedsToRefresh = await feedService.getFeedsToRefresh('paid')
    logger.info(`Found ${feedsToRefresh.length} feeds to refresh`)

    const batchSize = 10
    let refreshed = 0
    let failed = 0

    for (let i = 0; i < feedsToRefresh.length; i += batchSize) {
      const batch = feedsToRefresh.slice(i, i + batchSize)

      const results = await Promise.allSettled(
        batch.map(async (feedId) => {
          try {
            const newArticleIds = await feedService.refreshFeed(feedId)
            logger.debug(`Refreshed feed ${feedId}`)

            // Run feed actions on new articles
            if (newArticleIds.length > 0) {
              try {
                await executeActions(BigInt(feedId), newArticleIds)
              } catch (err) {
                logger.warn(`Feed actions failed for feed ${feedId}:`, err)
              }
            }

            return true
          } catch (error) {
            logger.error(`Failed to refresh feed ${feedId}:`, error)
            throw error
          }
        })
      )

      refreshed += results.filter((r) => r.status === 'fulfilled').length
      failed += results.filter((r) => r.status === 'rejected').length

      // Small delay between batches
      if (i + batchSize < feedsToRefresh.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    logger.info(`Completed feed sync: ${refreshed} refreshed, ${failed} failed`)

    // ── Batch AI Summarization ──────────────────────────────
    // Generate summaries for recent articles that don't have one yet.
    // Uses cheapest provider, non-blocking failures.
    let summarized = 0
    try {
      const hasAIProvider = !!(
        process.env.AZURE_OPENAI_KEY ||
        process.env.AWS_ACCESS_KEY_ID ||
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY
      )

      if (hasAIProvider) {
        // Find articles from last 2 hours without a cached summary
        const recentArticles = await prisma.article.findMany({
          where: {
            createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            aiCache: { none: { type: 'summary' } },
          },
          select: {
            id: true,
            title: true,
            contentHtml: true,
            summaryHtml: true,
            url: true,
            feed: {
              select: {
                subscriptions: {
                  select: { userId: true },
                  take: 1,
                },
              },
            },
          },
          take: 50, // cap per sync cycle
        })

        logger.info(`Batch summarizing ${recentArticles.length} articles...`)

        // Process in small batches to avoid rate limits
        const summaryBatch = 5
        for (let i = 0; i < recentArticles.length; i += summaryBatch) {
          const articleBatch = recentArticles.slice(i, i + summaryBatch)

          await Promise.allSettled(
            articleBatch.map(async (article) => {
              const userId = article.feed.subscriptions[0]?.userId
              if (!userId) return

              try {
                await aiService.summarizeArticle(
                  {
                    title: article.title || '',
                    content: article.contentHtml || article.summaryHtml || '',
                    url: article.url || '',
                  },
                  Number(article.id),
                  userId
                )
                summarized++
              } catch (err) {
                logger.warn(`Batch summary failed for article ${article.id}:`, err)
              }
            })
          )

          // Rate limit delay between batches
          if (i + summaryBatch < recentArticles.length) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }

        logger.info(`Batch summarization complete: ${summarized} articles summarized`)
      }
    } catch (error) {
      logger.warn('Batch summarization error (non-fatal):', error)
    }

    // ── Update AutoTTL ──────────────────────────────────────
    // Recalculate posting frequency for all active feeds
    try {
      await updateFeedTTLs()
    } catch (error) {
      logger.warn('AutoTTL update error (non-fatal):', error)
    }

    // ── Embeddings & Clustering ──────────────────────────────
    // Generate embeddings for new articles, then re-cluster
    let embedded = 0
    let clustered = 0
    try {
      const hasEmbeddingProvider = !!(process.env.AZURE_OPENAI_KEY || process.env.OPENAI_API_KEY)

      if (hasEmbeddingProvider) {
        embedded = await generateMissingEmbeddings(50) // Cap per cycle
        if (embedded > 0) {
          clustered = await generateTopicClusters()
        }
        logger.info(`Embeddings: ${embedded} generated, ${clustered} clusters created`)
      }
    } catch (error) {
      logger.warn('Embedding/clustering error (non-fatal):', error)
    }

    return NextResponse.json({
      message: 'Feed sync completed',
      total: feedsToRefresh.length,
      refreshed,
      failed,
      summarized,
      embedded,
      clustered,
    })
  } catch (error) {
    logger.error('Error during scheduled feed sync:', error)
    return NextResponse.json({ error: 'Feed sync failed' }, { status: 500 })
  }
}

/**
 * Recalculate avgPostsPerDay and autoTtlMinutes for all feeds
 * based on recent posting activity.
 */
async function updateFeedTTLs() {
  const feeds = await prisma.feed.findMany({
    select: { id: true },
  })

  for (const feed of feeds) {
    try {
      // Count articles from last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const articleCount = await prisma.article.count({
        where: {
          feedId: feed.id,
          publishedAt: { gte: weekAgo },
        },
      })

      const avgPostsPerDay = articleCount / 7

      // Calculate TTL based on frequency
      let autoTtlMinutes: number
      if (avgPostsPerDay > 5) {
        autoTtlMinutes = 30        // High frequency: every 30 min
      } else if (avgPostsPerDay > 1) {
        autoTtlMinutes = 120       // Medium: every 2 hours
      } else if (avgPostsPerDay > 0.1) {
        autoTtlMinutes = 360       // Low: every 6 hours
      } else {
        autoTtlMinutes = 1440      // Dormant: once a day
      }

      await prisma.feed.update({
        where: { id: feed.id },
        data: { avgPostsPerDay, autoTtlMinutes },
      })
    } catch {
      // Non-fatal per feed
    }
  }
}
