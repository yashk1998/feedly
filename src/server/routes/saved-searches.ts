import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { parseSearchQuery, buildPrismaFilter } from '@/lib/search-parser'

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  query: z.string().min(1).max(500),
  filters: z.object({
    category: z.string().optional(),
    feedId: z.number().optional(),
    unread: z.boolean().optional(),
    tags: z.array(z.number()).optional(),
  }).optional(),
  isPinned: z.boolean().optional().default(false),
})

const updateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  isPinned: z.boolean().optional(),
})

const app = new Hono()

// GET /api/saved-searches
app.get('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    })

    return c.json({
      searches: searches.map((s) => ({
        id: Number(s.id),
        name: s.name,
        query: s.query,
        filters: s.filters,
        isPinned: s.isPinned,
        createdAt: s.createdAt,
      })),
    })
  } catch (error) {
    logger.error('Error fetching saved searches:', error)
    return c.json({ error: 'Failed to fetch saved searches' }, 500)
  }
})

// POST /api/saved-searches
app.post('/', requireAuth, zValidator('json', createSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const userId = c.get('userId')

    const count = await prisma.savedSearch.count({ where: { userId } })
    if (count >= 20) {
      return c.json({ error: 'Maximum of 20 saved searches reached' }, 400)
    }

    const search = await prisma.savedSearch.create({
      data: { userId, ...data },
    })

    return c.json({
      id: Number(search.id),
      name: search.name,
      query: search.query,
      filters: search.filters,
      isPinned: search.isPinned,
      createdAt: search.createdAt,
    }, 201)
  } catch (error) {
    logger.error('Error creating saved search:', error)
    return c.json({ error: 'Failed to create saved search' }, 500)
  }
})

// PUT /api/saved-searches/:id
app.put('/:id', requireAuth, zValidator('json', updateSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(id)) return c.json({ error: 'Invalid id' }, 400)
    const userId = c.get('userId')
    const updates = c.req.valid('json')

    const existing = await prisma.savedSearch.findFirst({
      where: { id: BigInt(id), userId },
    })
    if (!existing) return c.json({ error: 'Saved search not found' }, 404)

    const updated = await prisma.savedSearch.update({
      where: { id: BigInt(id) },
      data: updates,
    })

    return c.json({
      id: Number(updated.id),
      name: updated.name,
      query: updated.query,
      filters: updated.filters,
      isPinned: updated.isPinned,
    })
  } catch (error) {
    logger.error('Error updating saved search:', error)
    return c.json({ error: 'Failed to update saved search' }, 500)
  }
})

// DELETE /api/saved-searches/:id
app.delete('/:id', requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(id)) return c.json({ error: 'Invalid id' }, 400)
    const userId = c.get('userId')

    const existing = await prisma.savedSearch.findFirst({
      where: { id: BigInt(id), userId },
    })
    if (!existing) return c.json({ error: 'Saved search not found' }, 404)

    await prisma.savedSearch.delete({ where: { id: BigInt(id) } })

    return c.json({ message: 'Saved search deleted' })
  } catch (error) {
    logger.error('Error deleting saved search:', error)
    return c.json({ error: 'Failed to delete saved search' }, 500)
  }
})

// GET /api/saved-searches/:id/rss — generate RSS feed from saved search results
// Uses a token query parameter for authentication (RSS readers can't send cookies)
app.get('/:id/rss', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(id)) return c.text('Invalid id', 400)

    const token = c.req.query('token')
    if (!token) return c.text('Token required', 401)

    // Verify token: HMAC(searchId, CRON_SECRET || NEXTAUTH_SECRET)
    const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET || ''
    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(`saved-search:${id}`)
      .digest('hex')
      .slice(0, 32)

    if (token !== expectedToken) return c.text('Invalid token', 403)

    const search = await prisma.savedSearch.findUnique({
      where: { id: BigInt(id) },
    })

    if (!search) return c.text('Saved search not found', 404)

    const userId = search.userId
    const parsed = parseSearchQuery(search.query)
    const searchFilters = buildPrismaFilter(parsed, userId)
    const filters = search.filters as Record<string, any> | null

    const where: any = {
      feed: {
        subscriptions: {
          some: {
            OR: [{ userId }, { team: { members: { some: { userId } } } }],
            ...(filters?.category ? { category: filters.category } : {}),
          },
        },
      },
      ...searchFilters,
    }

    if (filters?.feedId) {
      where.feedId = BigInt(filters.feedId)
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        feed: { select: { title: true, url: true, siteUrl: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })

    // Generate RSS 2.0 XML
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const escapeXml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const items = articles.map((a) => `    <item>
      <title>${escapeXml(a.title || 'Untitled')}</title>
      <link>${escapeXml(a.url || '')}</link>
      <guid isPermaLink="false">${a.id}</guid>
      <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : ''}</pubDate>
      ${a.author ? `<author>${escapeXml(a.author)}</author>` : ''}
      <source url="${escapeXml(a.feed.url)}">${escapeXml(a.feed.title || '')}</source>
      <description><![CDATA[${(a.summaryHtml || '').slice(0, 2000)}]]></description>
    </item>`).join('\n')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Syncd: ${escapeXml(search.name)}</title>
    <link>${baseUrl}</link>
    <description>Saved search: ${escapeXml(search.query)}</description>
    <atom:link href="${baseUrl}/api/saved-searches/${id}/rss?token=${token}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Syncd RSS</generator>
${items}
  </channel>
</rss>`

    return c.text(rss, 200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    })
  } catch (error) {
    logger.error('Error generating RSS for saved search:', error)
    return c.text('Failed to generate RSS feed', 500)
  }
})

// GET /api/saved-searches/:id/rss-url — get the RSS URL with token for this search
app.get('/:id/rss-url', requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(id)) return c.json({ error: 'Invalid id' }, 400)
    const userId = c.get('userId')

    const existing = await prisma.savedSearch.findFirst({
      where: { id: BigInt(id), userId },
    })
    if (!existing) return c.json({ error: 'Saved search not found' }, 404)

    const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET || ''
    const token = crypto
      .createHmac('sha256', secret)
      .update(`saved-search:${id}`)
      .digest('hex')
      .slice(0, 32)

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const rssUrl = `${baseUrl}/api/saved-searches/${id}/rss?token=${token}`

    return c.json({ rssUrl })
  } catch (error) {
    logger.error('Error generating RSS URL:', error)
    return c.json({ error: 'Failed to generate RSS URL' }, 500)
  }
})

export default app
