import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { JSDOM } from 'jsdom'
import { requireAuth } from '../middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { feedService } from '../services/feeds'

interface OPMLOutline {
  title: string
  xmlUrl: string
  htmlUrl?: string
  category?: string
}

const addFeedSchema = z.object({
  url: z.string().url(),
  category: z.string().optional(),
})

const updateFeedSchema = z.object({
  category: z.string().optional(),
})

const app = new Hono()

// GET /api/feeds
app.get('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const personalSubscriptions = await prisma.subscription.findMany({
      where: { userId, teamId: null },
      include: { feed: true },
    })

    const teamSubscriptions = await prisma.subscription.findMany({
      where: { team: { members: { some: { userId } } } },
      include: { feed: true },
    })

    const allSubscriptions = [...personalSubscriptions, ...teamSubscriptions]
    const feedIds = Array.from(new Set(allSubscriptions.map((sub) => Number(sub.feedId))))

    let totalArticleCounts: Array<{ feedId: bigint; _count: { _all: number } }> = []
    let unreadArticleCounts: Array<{ feedId: bigint; _count: { _all: number } }> = []

    if (feedIds.length > 0) {
      ;[totalArticleCounts, unreadArticleCounts] = await Promise.all([
        prisma.article.groupBy({
          by: ['feedId'],
          where: { feedId: { in: feedIds.map((id) => BigInt(id)) } },
          _count: { _all: true },
        }),
        prisma.article.groupBy({
          by: ['feedId'],
          where: {
            feedId: { in: feedIds.map((id) => BigInt(id)) },
            reads: { none: { userId } },
          },
          _count: { _all: true },
        }),
      ])
    }

    const totalMap = new Map(totalArticleCounts.map((e) => [Number(e.feedId), e._count._all]))
    const unreadMap = new Map(unreadArticleCounts.map((e) => [Number(e.feedId), e._count._all]))

    const feeds = allSubscriptions.map((sub) => {
      const feedId = Number(sub.feedId)
      const lastFetchedAt = sub.feed.lastFetchedAt?.toISOString() ?? null
      const lastFetchedAgeMs = sub.feed.lastFetchedAt ? Date.now() - sub.feed.lastFetchedAt.getTime() : undefined
      const twelveHoursInMs = 12 * 60 * 60 * 1000

      return {
        id: feedId,
        subscriptionId: Number(sub.id),
        url: sub.feed.url,
        title: sub.feed.title,
        siteUrl: sub.feed.siteUrl,
        category: sub.category || 'General',
        viewType: sub.feed.viewType || 'article',
        lastFetchedAt,
        unreadCount: unreadMap.get(feedId) || 0,
        totalArticles: totalMap.get(feedId) || 0,
        isTeamFeed: sub.teamId !== null,
        isActive: typeof lastFetchedAgeMs === 'number' ? lastFetchedAgeMs < twelveHoursInMs : false,
      }
    })

    return c.json({ feeds })
  } catch (error) {
    logger.error('Error fetching feeds:', error)
    return c.json({ error: 'Failed to fetch feeds' }, 500)
  }
})

// POST /api/feeds
app.post('/', requireAuth, zValidator('json', addFeedSchema), async (c) => {
  try {
    const { url, category } = c.req.valid('json')
    const userId = c.get('userId')

    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId, teamId: null, feed: { url } },
    })

    if (existingSubscription) {
      return c.json({ error: 'Already subscribed to this feed' }, 409)
    }

    const feed = await feedService.getOrCreateFeed(url)

    const subscription = await prisma.subscription.create({
      data: { userId, feedId: feed.id, category: category || 'General' },
      include: { feed: true },
    })

    const feedId = Number(subscription.feedId)
    const [unreadCount, totalArticles] = await Promise.all([
      prisma.article.count({
        where: { feedId: subscription.feedId, reads: { none: { userId } } },
      }),
      prisma.article.count({ where: { feedId: subscription.feedId } }),
    ])

    // Detect view type in background (non-blocking)
    feedService.detectViewType(subscription.feedId).then(async (viewType) => {
      if (viewType !== 'article') {
        await prisma.feed.update({
          where: { id: subscription.feedId },
          data: { viewType },
        })
      }
    }).catch((err) => logger.warn('View type detection failed:', err))

    return c.json({
      feed: {
        id: feedId,
        subscriptionId: Number(subscription.id),
        url: subscription.feed.url,
        title: subscription.feed.title,
        siteUrl: subscription.feed.siteUrl,
        category: subscription.category || 'General',
        viewType: subscription.feed.viewType || 'article',
        lastFetchedAt: subscription.feed.lastFetchedAt?.toISOString() ?? null,
        unreadCount,
        totalArticles,
        isTeamFeed: false,
        isActive: true,
      },
    }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    logger.error('Error adding feed:', error)
    return c.json({ error: 'Failed to add feed' }, 500)
  }
})

// POST /api/feeds/:id/refresh
app.post('/:id/refresh', requireAuth, async (c) => {
  try {
    const feedId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(feedId)) return c.json({ error: 'Invalid feed id' }, 400)

    const userId = c.get('userId')

    const subscription = await prisma.subscription.findFirst({
      where: {
        feedId: BigInt(feedId),
        OR: [{ userId }, { team: { members: { some: { userId } } } }],
      },
    })

    if (!subscription) return c.json({ error: 'Subscription not found' }, 404)

    await feedService.refreshFeed(feedId)
    return c.json({ message: 'Feed refreshed successfully' })
  } catch (error) {
    logger.error('Error refreshing feed:', error)
    return c.json({ error: 'Failed to refresh feed' }, 500)
  }
})

// PUT /api/feeds/:id
app.put('/:id', requireAuth, zValidator('json', updateFeedSchema), async (c) => {
  try {
    const subscriptionId = parseInt(c.req.param('id'), 10)
    const { category } = c.req.valid('json')
    const userId = c.get('userId')

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        OR: [
          { userId },
          { team: { members: { some: { userId, role: { in: ['owner', 'editor'] } } } } },
        ],
      },
    })

    if (!subscription) return c.json({ error: 'Subscription not found' }, 404)

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { category },
      include: { feed: true },
    })

    return c.json({
      feed: {
        id: Number(updated.feed.id),
        subscriptionId: Number(updated.id),
        url: updated.feed.url,
        title: updated.feed.title,
        siteUrl: updated.feed.siteUrl,
        category: updated.category || 'General',
        lastFetchedAt: updated.feed.lastFetchedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid input', details: error.errors }, 400)
    logger.error('Error updating feed:', error)
    return c.json({ error: 'Failed to update feed' }, 500)
  }
})

// DELETE /api/feeds/:id
app.delete('/:id', requireAuth, async (c) => {
  try {
    const subscriptionId = parseInt(c.req.param('id'), 10)
    const userId = c.get('userId')

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        OR: [
          { userId },
          { team: { members: { some: { userId, role: { in: ['owner', 'editor'] } } } } },
        ],
      },
    })

    if (!subscription) return c.json({ error: 'Subscription not found' }, 404)

    await prisma.subscription.delete({ where: { id: subscriptionId } })
    return c.json({ message: 'Unsubscribed successfully' })
  } catch (error) {
    logger.error('Error deleting feed:', error)
    return c.json({ error: 'Failed to unsubscribe' }, 500)
  }
})

// GET /api/feeds/export-opml
app.get('/export-opml', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const subscriptions = await prisma.subscription.findMany({
      where: { userId, teamId: null },
      include: { feed: true },
      orderBy: { category: 'asc' },
    })

    const feedsByCategory = subscriptions.reduce((acc, sub) => {
      const cat = sub.category || 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(sub.feed)
      return acc
    }, {} as Record<string, typeof subscriptions[number]['feed'][]>)

    const outlines = Object.entries(feedsByCategory)
      .map(([category, feeds]) => {
        const feedOutlines = feeds
          .map((f) => {
            const title = (f.title || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
            const xmlUrl = f.url.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            const htmlUrl = f.siteUrl ? f.siteUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;') : ''
            return `      <outline type="rss" text="${title}" title="${title}" xmlUrl="${xmlUrl}"${htmlUrl ? ` htmlUrl="${htmlUrl}"` : ''} />`
          })
          .join('\n')
        const catEscaped = category.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        return `    <outline text="${catEscaped}" title="${catEscaped}">\n${feedOutlines}\n    </outline>`
      })
      .join('\n')

    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Syncd Feed Export</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>`

    return new Response(opml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="syncd-feeds.opml"',
      },
    })
  } catch (error) {
    logger.error('Error exporting OPML:', error)
    return c.json({ error: 'Failed to export OPML' }, 500)
  }
})

// POST /api/feeds/import-opml
app.post('/import-opml', requireAuth, async (c) => {
  try {
    const { opmlContent } = await c.req.json()
    const userId = c.get('userId')

    if (!opmlContent || typeof opmlContent !== 'string') {
      return c.json({ error: 'OPML content is required' }, 400)
    }

    const dom = new JSDOM(opmlContent, { contentType: 'text/xml' })
    const doc = dom.window.document
    const outlines = doc.querySelectorAll('outline[xmlUrl]')
    const feedsToImport: OPMLOutline[] = []

    outlines.forEach((outline) => {
      const xmlUrl = outline.getAttribute('xmlUrl')
      if (xmlUrl) {
        const parentOutline = outline.parentElement
        let category = 'General'
        if (parentOutline && parentOutline.tagName === 'outline' && !parentOutline.hasAttribute('xmlUrl')) {
          category = parentOutline.getAttribute('title') || parentOutline.getAttribute('text') || 'General'
        }
        feedsToImport.push({
          title: outline.getAttribute('title') || outline.getAttribute('text') || '',
          xmlUrl,
          htmlUrl: outline.getAttribute('htmlUrl') || undefined,
          category,
        })
      }
    })

    if (feedsToImport.length === 0) {
      return c.json({ error: 'No valid feeds found in OPML file' }, 400)
    }

    const results = { imported: 0, skipped: 0, failed: 0, feeds: [] as Array<{ url: string; title: string; status: string }> }

    for (const feedData of feedsToImport) {
      try {
        const existingSub = await prisma.subscription.findFirst({
          where: { userId, teamId: null, feed: { url: feedData.xmlUrl } },
        })

        if (existingSub) {
          results.skipped++
          results.feeds.push({ url: feedData.xmlUrl, title: feedData.title, status: 'skipped' })
          continue
        }

        const feed = await feedService.getOrCreateFeed(feedData.xmlUrl)
        await prisma.subscription.create({
          data: { userId, feedId: feed.id, category: feedData.category },
        })

        results.imported++
        results.feeds.push({ url: feedData.xmlUrl, title: feed.title || feedData.title, status: 'imported' })
      } catch (error) {
        logger.error(`Failed to import feed ${feedData.xmlUrl}:`, error)
        results.failed++
        results.feeds.push({ url: feedData.xmlUrl, title: feedData.title, status: 'failed' })
      }
    }

    return c.json({
      message: `Imported ${results.imported} feeds, skipped ${results.skipped} existing, ${results.failed} failed`,
      results,
    })
  } catch (error) {
    logger.error('Error importing OPML:', error)
    return c.json({ error: 'Failed to import OPML file' }, 500)
  }
})

// GET /api/feeds/discover — browse & search the feed directory
app.get('/discover', requireAuth, async (c) => {
  try {
    const q = c.req.query('q') || ''
    const category = c.req.query('category') || ''
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = 20
    const offset = (page - 1) * limit

    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { url: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = category
    }

    const [feeds, total] = await Promise.all([
      prisma.feedDirectory.findMany({
        where,
        orderBy: [{ subscribers: 'desc' }, { avgPostsPerWeek: 'desc' }],
        skip: offset,
        take: limit,
      }),
      prisma.feedDirectory.count({ where }),
    ])

    // Check which feeds the user is already subscribed to
    const userId = c.get('userId')
    const subscribedUrls = new Set(
      (await prisma.subscription.findMany({
        where: { userId, teamId: null },
        select: { feed: { select: { url: true } } },
      })).map((s) => s.feed.url)
    )

    const results = feeds.map((f) => ({
      id: Number(f.id),
      url: f.url,
      title: f.title,
      description: f.description,
      category: f.category,
      language: f.language,
      subscribers: f.subscribers,
      avgPostsPerWeek: f.avgPostsPerWeek,
      isVerified: f.isVerified,
      isSubscribed: subscribedUrls.has(f.url),
    }))

    // Get all categories for filter UI
    const categories = await prisma.feedDirectory.groupBy({
      by: ['category'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
    })

    return c.json({
      feeds: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories: categories.map((cat) => ({ name: cat.category, count: cat._count._all })),
    })
  } catch (error) {
    logger.error('Error in feed discovery:', error)
    return c.json({ error: 'Failed to search feed directory' }, 500)
  }
})

export default app
