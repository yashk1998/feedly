import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { feedService } from '../services/feeds'
import { parseSearchQuery, buildPrismaFilter } from '@/lib/search-parser'
import { smartRankArticles } from '../services/ranking'

const markReadSchema = z.object({
  articleIds: z.array(z.number()).optional(),
  all: z.boolean().optional(),
})

const app = new Hono()

// Important: register /saved before /:id to avoid collision
// GET /api/articles/saved
app.get('/saved', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const savedArticles = await prisma.savedArticle.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            feed: { select: { id: true, title: true, siteUrl: true } },
            reads: { where: { userId }, select: { readAt: true } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    })

    const formattedArticles = savedArticles.map((saved) => ({
      id: Number(saved.article.id),
      title: saved.article.title,
      url: saved.article.url,
      publishedAt: saved.article.publishedAt,
      author: saved.article.author,
      summary: saved.article.summaryHtml,
      feed: {
        id: Number(saved.article.feed.id),
        title: saved.article.feed.title,
        siteUrl: saved.article.feed.siteUrl,
      },
      isRead: saved.article.reads.length > 0,
      readAt: saved.article.reads[0]?.readAt || null,
      isSaved: true,
      savedAt: saved.savedAt,
    }))

    return c.json({ articles: formattedArticles })
  } catch (error) {
    logger.error('Error fetching saved articles:', error)
    return c.json({ error: 'Failed to fetch saved articles' }, 500)
  }
})

// GET /api/articles
app.get('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = parseInt(c.req.query('limit') || '20', 10)
    const feedId = c.req.query('feedId')
    const category = c.req.query('category')
    const unread = c.req.query('unread')
    const search = c.req.query('search')
    const sort = c.req.query('sort') // 'smart' | 'latest' (default)
    const skip = (page - 1) * limit

    const subscriptionFilter: any = {
      OR: [{ userId }, { team: { members: { some: { userId } } } }],
    }

    if (category && category !== 'all') {
      subscriptionFilter.category = category
    }

    const where: any = {
      feed: { subscriptions: { some: subscriptionFilter } },
    }

    if (feedId) {
      const feedIdNum = parseInt(feedId, 10)
      if (!Number.isNaN(feedIdNum)) where.feedId = BigInt(feedIdNum)
    }

    if (unread === 'true') {
      where.reads = { none: { userId } }
    }

    if (search) {
      const parsed = parseSearchQuery(search)
      const searchFilters = buildPrismaFilter(parsed, userId)

      // Override unread filter if is:read or is:unread is in search
      if (parsed.is.includes('read')) {
        delete where.reads
      } else if (parsed.is.includes('unread')) {
        delete where.reads
      }

      Object.assign(where, searchFilters)
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        feed: { select: { id: true, title: true, siteUrl: true } },
        reads: { where: { userId }, select: { readAt: true } },
        savedArticles: { where: { userId }, select: { savedAt: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.article.count({ where })

    let formattedArticles = articles.map((article) => ({
      id: Number(article.id),
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: article.summaryHtml,
      content: article.contentHtml,
      feed: {
        id: Number(article.feed.id),
        title: article.feed.title,
        siteUrl: article.feed.siteUrl,
      },
      isRead: article.reads.length > 0,
      readAt: article.reads[0]?.readAt || null,
      isSaved: article.savedArticles.length > 0,
      savedAt: article.savedArticles[0]?.savedAt || null,
      tags: article.tags.map((at) => ({ id: Number(at.tag.id), name: at.tag.name, color: at.tag.color })),
    }))

    // Smart ranking: re-order by interest profile similarity
    if (sort === 'smart' && formattedArticles.length > 1) {
      try {
        const articleIds = formattedArticles.map((a) => BigInt(a.id))
        const rankedIds = await smartRankArticles(userId, articleIds)
        const idOrder = new Map(rankedIds.map((id, idx) => [Number(id), idx]))
        formattedArticles = [...formattedArticles].sort(
          (a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999)
        )
      } catch (err) {
        logger.warn('Smart ranking failed:', err)
      }
    }

    return c.json({
      articles: formattedArticles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Error fetching articles:', error)
    return c.json({ error: 'Failed to fetch articles' }, 500)
  }
})

// GET /api/articles/:id
app.get('/:id', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article id' }, 400)

    const userId = c.get('userId')

    const article = await prisma.article.findFirst({
      where: {
        id: BigInt(articleId),
        feed: {
          subscriptions: {
            some: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
          },
        },
      },
      include: {
        feed: { select: { id: true, title: true, siteUrl: true } },
        reads: { where: { userId }, select: { readAt: true } },
        savedArticles: { where: { userId }, select: { savedAt: true } },
      },
    })

    if (!article) return c.json({ error: 'Article not found' }, 404)

    if (article.reads.length === 0) {
      await prisma.articleRead.create({
        data: { articleId: BigInt(articleId), userId },
      })
    }

    return c.json({
      id: Number(article.id),
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: article.summaryHtml,
      content: article.contentHtml,
      feed: {
        id: Number(article.feed.id),
        title: article.feed.title,
        siteUrl: article.feed.siteUrl,
      },
      isRead: true,
      readAt: article.reads[0]?.readAt || new Date(),
      isSaved: article.savedArticles.length > 0,
      savedAt: article.savedArticles[0]?.savedAt || null,
    })
  } catch (error) {
    logger.error('Error fetching article:', error)
    return c.json({ error: 'Failed to fetch article' }, 500)
  }
})

// POST /api/articles/mark-read
app.post('/mark-read', requireAuth, zValidator('json', markReadSchema), async (c) => {
  try {
    const { articleIds, all } = c.req.valid('json')
    const userId = c.get('userId')

    if (all) {
      const unreadArticles = await prisma.article.findMany({
        where: {
          reads: { none: { userId } },
          feed: {
            subscriptions: {
              some: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
            },
          },
        },
        select: { id: true },
      })

      await prisma.articleRead.createMany({
        data: unreadArticles.map((a) => ({ articleId: a.id, userId })),
        skipDuplicates: true,
      })

      return c.json({ message: `Marked ${unreadArticles.length} articles as read` })
    }

    if (articleIds && articleIds.length > 0) {
      await prisma.articleRead.createMany({
        data: articleIds.map((id) => ({ articleId: BigInt(id), userId })),
        skipDuplicates: true,
      })
      return c.json({ message: `Marked ${articleIds.length} articles as read` })
    }

    return c.json({ error: 'Must provide either articleIds or all=true' }, 400)
  } catch (error) {
    logger.error('Error marking articles as read:', error)
    return c.json({ error: 'Failed to mark articles as read' }, 500)
  }
})

// POST /api/articles/:id/read
app.post('/:id/read', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article id' }, 400)
    const userId = c.get('userId')

    await prisma.articleRead.upsert({
      where: { articleId_userId: { articleId: BigInt(articleId), userId } },
      update: {},
      create: { articleId: BigInt(articleId), userId },
    })

    return c.json({ message: 'Article marked as read' })
  } catch (error) {
    logger.error('Error marking article as read:', error)
    return c.json({ error: 'Failed to mark article as read' }, 500)
  }
})

// POST /api/articles/:id/unread
app.post('/:id/unread', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article id' }, 400)
    const userId = c.get('userId')

    await prisma.articleRead.deleteMany({
      where: { articleId: BigInt(articleId), userId },
    })

    return c.json({ message: 'Article marked as unread' })
  } catch (error) {
    logger.error('Error marking article as unread:', error)
    return c.json({ error: 'Failed to mark article as unread' }, 500)
  }
})

// POST /api/articles/:id/save
app.post('/:id/save', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article id' }, 400)
    const userId = c.get('userId')

    await prisma.savedArticle.upsert({
      where: { articleId_userId: { articleId: BigInt(articleId), userId } },
      update: {},
      create: { articleId: BigInt(articleId), userId },
    })

    return c.json({ message: 'Article saved', isSaved: true })
  } catch (error) {
    logger.error('Error saving article:', error)
    return c.json({ error: 'Failed to save article' }, 500)
  }
})

// DELETE /api/articles/:id/save
app.delete('/:id/save', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article id' }, 400)
    const userId = c.get('userId')

    await prisma.savedArticle.deleteMany({
      where: { articleId: BigInt(articleId), userId },
    })

    return c.json({ message: 'Article removed from saved', isSaved: false })
  } catch (error) {
    logger.error('Error removing saved article:', error)
    return c.json({ error: 'Failed to remove saved article' }, 500)
  }
})

// POST /api/articles/:id/fetch-content
app.post('/:id/fetch-content', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article id' }, 400)
    const userId = c.get('userId')

    const article = await prisma.article.findFirst({
      where: {
        id: BigInt(articleId),
        feed: {
          subscriptions: {
            some: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
          },
        },
      },
      include: {
        feed: { select: { id: true, title: true, siteUrl: true } },
        reads: { where: { userId }, select: { readAt: true } },
        savedArticles: { where: { userId }, select: { savedAt: true } },
      },
    })

    if (!article) return c.json({ error: 'Article not found' }, 404)
    if (!article.url) return c.json({ error: 'Article has no source URL' }, 400)

    const extracted = await feedService.fetchFullArticleContent(article.url)

    if (!extracted?.content) {
      return c.json({
        error: 'Could not extract content from the article URL.',
        suggestion: 'Try visiting the original article directly.',
      }, 422)
    }

    await prisma.article.update({
      where: { id: BigInt(articleId) },
      data: {
        contentHtml: extracted.content,
        summaryHtml: extracted.excerpt || article.summaryHtml,
      },
    })

    return c.json({
      id: Number(article.id),
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: extracted.excerpt || article.summaryHtml,
      content: extracted.content,
      feed: {
        id: Number(article.feed.id),
        title: article.feed.title,
        siteUrl: article.feed.siteUrl,
      },
      isRead: article.reads.length > 0,
      readAt: article.reads[0]?.readAt || null,
      isSaved: article.savedArticles.length > 0,
      savedAt: article.savedArticles[0]?.savedAt || null,
    })
  } catch (error) {
    logger.error('Error fetching full article content:', error)
    return c.json({ error: 'Failed to fetch article content' }, 500)
  }
})

export default app
