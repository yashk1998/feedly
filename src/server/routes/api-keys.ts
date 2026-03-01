import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const createKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'groq']),
  apiKey: z.string().min(10),
  model: z.string().optional(),
})

const updateKeySchema = z.object({
  apiKey: z.string().min(10).optional(),
  model: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

const app = new Hono()

// GET /api/api-keys — list user's API keys (masked)
app.get('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const keys = await prisma.userApiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return c.json({
      keys: keys.map((k) => ({
        id: Number(k.id),
        provider: k.provider,
        model: k.model,
        isActive: k.isActive,
        createdAt: k.createdAt.toISOString(),
        hasKey: true,
        // Mask the key — show only last 4 chars
        maskedKey: '••••••••' + k.apiKey.slice(-4),
      })),
    })
  } catch (error) {
    logger.error('Error fetching API keys:', error)
    return c.json({ error: 'Failed to fetch API keys' }, 500)
  }
})

// POST /api/api-keys — add or update a provider key
app.post('/', requireAuth, zValidator('json', createKeySchema), async (c) => {
  try {
    const userId = c.get('userId')
    const { provider, apiKey, model } = c.req.valid('json')

    const key = await prisma.userApiKey.upsert({
      where: {
        userId_provider: { userId, provider },
      },
      update: {
        apiKey,
        model: model || null,
        isActive: true,
      },
      create: {
        userId,
        provider,
        apiKey,
        model: model || null,
      },
    })

    return c.json({
      key: {
        id: Number(key.id),
        provider: key.provider,
        model: key.model,
        isActive: key.isActive,
        maskedKey: '••••••••' + key.apiKey.slice(-4),
      },
    }, 201)
  } catch (error) {
    logger.error('Error saving API key:', error)
    return c.json({ error: 'Failed to save API key' }, 500)
  }
})

// PUT /api/api-keys/:id — update a key
app.put('/:id', requireAuth, zValidator('json', updateKeySchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const userId = c.get('userId')
    const data = c.req.valid('json')

    const existing = await prisma.userApiKey.findFirst({
      where: { id: BigInt(id), userId },
    })

    if (!existing) return c.json({ error: 'API key not found' }, 404)

    const updated = await prisma.userApiKey.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    return c.json({
      key: {
        id: Number(updated.id),
        provider: updated.provider,
        model: updated.model,
        isActive: updated.isActive,
        maskedKey: '••••••••' + updated.apiKey.slice(-4),
      },
    })
  } catch (error) {
    logger.error('Error updating API key:', error)
    return c.json({ error: 'Failed to update API key' }, 500)
  }
})

// DELETE /api/api-keys/:id — remove a key
app.delete('/:id', requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const userId = c.get('userId')

    const existing = await prisma.userApiKey.findFirst({
      where: { id: BigInt(id), userId },
    })

    if (!existing) return c.json({ error: 'API key not found' }, 404)

    await prisma.userApiKey.delete({ where: { id: BigInt(id) } })
    return c.json({ message: 'API key deleted' })
  } catch (error) {
    logger.error('Error deleting API key:', error)
    return c.json({ error: 'Failed to delete API key' }, 500)
  }
})

export default app
