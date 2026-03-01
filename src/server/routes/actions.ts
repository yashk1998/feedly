import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const actionSchema = z.object({
  feedId: z.number(),
  type: z.enum(['silence', 'notify', 'tag', 'webhook', 'translate']),
  config: z.record(z.any()).optional().default({}),
  isEnabled: z.boolean().optional().default(true),
})

const updateActionSchema = z.object({
  config: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional(),
})

const app = new Hono()

// GET /api/actions — list user's feed actions
app.get('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const actions = await prisma.feedAction.findMany({
      where: { userId },
      include: {
        feed: { select: { id: true, title: true, url: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return c.json({
      actions: actions.map((a) => ({
        id: Number(a.id),
        feedId: Number(a.feedId),
        feedTitle: a.feed.title,
        feedUrl: a.feed.url,
        type: a.type,
        config: a.config,
        isEnabled: a.isEnabled,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error('Error fetching actions:', error)
    return c.json({ error: 'Failed to fetch actions' }, 500)
  }
})

// GET /api/actions/feed/:feedId — get actions for a specific feed
app.get('/feed/:feedId', requireAuth, async (c) => {
  try {
    const feedId = parseInt(c.req.param('feedId'), 10)
    const userId = c.get('userId')

    const actions = await prisma.feedAction.findMany({
      where: { feedId: BigInt(feedId), userId },
    })

    return c.json({
      actions: actions.map((a) => ({
        id: Number(a.id),
        type: a.type,
        config: a.config,
        isEnabled: a.isEnabled,
      })),
    })
  } catch (error) {
    logger.error('Error fetching feed actions:', error)
    return c.json({ error: 'Failed to fetch feed actions' }, 500)
  }
})

// POST /api/actions — create a feed action
app.post('/', requireAuth, zValidator('json', actionSchema), async (c) => {
  try {
    const { feedId, type, config, isEnabled } = c.req.valid('json')
    const userId = c.get('userId')

    // Verify user has access to this feed
    const subscription = await prisma.subscription.findFirst({
      where: {
        feedId: BigInt(feedId),
        OR: [{ userId }, { team: { members: { some: { userId } } } }],
      },
    })

    if (!subscription) return c.json({ error: 'Feed not found' }, 404)

    const action = await prisma.feedAction.upsert({
      where: {
        feedId_userId_type: {
          feedId: BigInt(feedId),
          userId,
          type,
        },
      },
      update: { config, isEnabled },
      create: {
        feedId: BigInt(feedId),
        userId,
        type,
        config,
        isEnabled,
      },
    })

    return c.json({
      action: {
        id: Number(action.id),
        feedId: Number(action.feedId),
        type: action.type,
        config: action.config,
        isEnabled: action.isEnabled,
      },
    }, 201)
  } catch (error) {
    logger.error('Error creating action:', error)
    return c.json({ error: 'Failed to create action' }, 500)
  }
})

// PUT /api/actions/:id — update a feed action
app.put('/:id', requireAuth, zValidator('json', updateActionSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const userId = c.get('userId')
    const data = c.req.valid('json')

    const existing = await prisma.feedAction.findFirst({
      where: { id: BigInt(id), userId },
    })

    if (!existing) return c.json({ error: 'Action not found' }, 404)

    const updated = await prisma.feedAction.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.config !== undefined && { config: data.config }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
    })

    return c.json({
      action: {
        id: Number(updated.id),
        type: updated.type,
        config: updated.config,
        isEnabled: updated.isEnabled,
      },
    })
  } catch (error) {
    logger.error('Error updating action:', error)
    return c.json({ error: 'Failed to update action' }, 500)
  }
})

// DELETE /api/actions/:id — delete a feed action
app.delete('/:id', requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const userId = c.get('userId')

    const existing = await prisma.feedAction.findFirst({
      where: { id: BigInt(id), userId },
    })

    if (!existing) return c.json({ error: 'Action not found' }, 404)

    await prisma.feedAction.delete({ where: { id: BigInt(id) } })
    return c.json({ message: 'Action deleted' })
  } catch (error) {
    logger.error('Error deleting action:', error)
    return c.json({ error: 'Failed to delete action' }, 500)
  }
})

export default app
