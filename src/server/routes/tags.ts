import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const createTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#4D7C5B'),
})

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

const tagArticleSchema = z.object({
  tagId: z.number(),
})

const app = new Hono()

// GET /api/tags — list user's tags
app.get('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: { _count: { select: { articles: true } } },
      orderBy: { name: 'asc' },
    })

    return c.json({
      tags: tags.map((t) => ({
        id: Number(t.id),
        name: t.name,
        color: t.color,
        articleCount: t._count.articles,
      })),
    })
  } catch (error) {
    logger.error('Error fetching tags:', error)
    return c.json({ error: 'Failed to fetch tags' }, 500)
  }
})

// POST /api/tags — create a tag
app.post('/', requireAuth, zValidator('json', createTagSchema), async (c) => {
  try {
    const { name, color } = c.req.valid('json')
    const userId = c.get('userId')

    const existing = await prisma.tag.findUnique({
      where: { userId_name: { userId, name } },
    })
    if (existing) {
      return c.json({ error: 'Tag already exists' }, 409)
    }

    const tag = await prisma.tag.create({
      data: { name, color, userId },
    })

    return c.json({
      id: Number(tag.id),
      name: tag.name,
      color: tag.color,
      articleCount: 0,
    }, 201)
  } catch (error) {
    logger.error('Error creating tag:', error)
    return c.json({ error: 'Failed to create tag' }, 500)
  }
})

// PUT /api/tags/:id — update a tag
app.put('/:id', requireAuth, zValidator('json', updateTagSchema), async (c) => {
  try {
    const tagId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(tagId)) return c.json({ error: 'Invalid tag id' }, 400)
    const userId = c.get('userId')
    const updates = c.req.valid('json')

    const tag = await prisma.tag.findFirst({
      where: { id: BigInt(tagId), userId },
    })
    if (!tag) return c.json({ error: 'Tag not found' }, 404)

    // Check name uniqueness if renaming
    if (updates.name && updates.name !== tag.name) {
      const dupe = await prisma.tag.findUnique({
        where: { userId_name: { userId, name: updates.name } },
      })
      if (dupe) return c.json({ error: 'Tag name already exists' }, 409)
    }

    const updated = await prisma.tag.update({
      where: { id: BigInt(tagId) },
      data: updates,
    })

    return c.json({ id: Number(updated.id), name: updated.name, color: updated.color })
  } catch (error) {
    logger.error('Error updating tag:', error)
    return c.json({ error: 'Failed to update tag' }, 500)
  }
})

// DELETE /api/tags/:id — delete a tag (cascades to article_tags)
app.delete('/:id', requireAuth, async (c) => {
  try {
    const tagId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(tagId)) return c.json({ error: 'Invalid tag id' }, 400)
    const userId = c.get('userId')

    const tag = await prisma.tag.findFirst({
      where: { id: BigInt(tagId), userId },
    })
    if (!tag) return c.json({ error: 'Tag not found' }, 404)

    await prisma.tag.delete({ where: { id: BigInt(tagId) } })

    return c.json({ message: 'Tag deleted' })
  } catch (error) {
    logger.error('Error deleting tag:', error)
    return c.json({ error: 'Failed to delete tag' }, 500)
  }
})

// POST /api/tags/article/:articleId — tag an article
app.post('/article/:articleId', requireAuth, zValidator('json', tagArticleSchema), async (c) => {
  try {
    const articleId = parseInt(c.req.param('articleId'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article id' }, 400)
    const { tagId } = c.req.valid('json')
    const userId = c.get('userId')

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id: BigInt(tagId), userId },
    })
    if (!tag) return c.json({ error: 'Tag not found' }, 404)

    // Verify article access
    const article = await prisma.article.findFirst({
      where: {
        id: BigInt(articleId),
        feed: { subscriptions: { some: { OR: [{ userId }, { team: { members: { some: { userId } } } }] } } },
      },
    })
    if (!article) return c.json({ error: 'Article not found' }, 404)

    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId: BigInt(articleId), tagId: BigInt(tagId) } },
      update: {},
      create: { articleId: BigInt(articleId), tagId: BigInt(tagId) },
    })

    return c.json({ message: 'Tag applied', articleId, tagId })
  } catch (error) {
    logger.error('Error tagging article:', error)
    return c.json({ error: 'Failed to tag article' }, 500)
  }
})

// DELETE /api/tags/article/:articleId/:tagId — remove tag from article
app.delete('/article/:articleId/:tagId', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('articleId'), 10)
    const tagId = parseInt(c.req.param('tagId'), 10)
    if (Number.isNaN(articleId) || Number.isNaN(tagId)) {
      return c.json({ error: 'Invalid id' }, 400)
    }
    const userId = c.get('userId')

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id: BigInt(tagId), userId },
    })
    if (!tag) return c.json({ error: 'Tag not found' }, 404)

    await prisma.articleTag.deleteMany({
      where: { articleId: BigInt(articleId), tagId: BigInt(tagId) },
    })

    return c.json({ message: 'Tag removed', articleId, tagId })
  } catch (error) {
    logger.error('Error removing tag:', error)
    return c.json({ error: 'Failed to remove tag' }, 500)
  }
})

// GET /api/tags/:id/articles — get articles with a specific tag
app.get('/:id/articles', requireAuth, async (c) => {
  try {
    const tagId = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(tagId)) return c.json({ error: 'Invalid tag id' }, 400)
    const userId = c.get('userId')
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = parseInt(c.req.query('limit') || '20', 10)

    const tag = await prisma.tag.findFirst({
      where: { id: BigInt(tagId), userId },
    })
    if (!tag) return c.json({ error: 'Tag not found' }, 404)

    const where = {
      tags: { some: { tagId: BigInt(tagId) } },
      feed: { subscriptions: { some: { OR: [{ userId }, { team: { members: { some: { userId } } } }] } } },
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          feed: { select: { id: true, title: true, siteUrl: true } },
          reads: { where: { userId }, select: { readAt: true } },
          savedArticles: { where: { userId }, select: { savedAt: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return c.json({
      tag: { id: Number(tag.id), name: tag.name, color: tag.color },
      articles: articles.map((a) => ({
        id: Number(a.id),
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        author: a.author,
        summary: a.summaryHtml,
        feed: { id: Number(a.feed.id), title: a.feed.title, siteUrl: a.feed.siteUrl },
        isRead: a.reads.length > 0,
        isSaved: a.savedArticles.length > 0,
        tags: a.tags.map((at) => ({ id: Number(at.tag.id), name: at.tag.name, color: at.tag.color })),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Error fetching tagged articles:', error)
    return c.json({ error: 'Failed to fetch tagged articles' }, 500)
  }
})

export default app
