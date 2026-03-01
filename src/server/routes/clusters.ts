import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { logger } from '@/lib/logger'
import { getActiveClusters, findSimilarArticles } from '../services/clustering'

const app = new Hono()

// GET /api/clusters — get active topic clusters
app.get('/', requireAuth, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10', 10)
    const clusters = await getActiveClusters(Math.min(limit, 20))
    return c.json({ clusters })
  } catch (error) {
    logger.error('Error fetching clusters:', error)
    return c.json({ error: 'Failed to fetch topic clusters' }, 500)
  }
})

// GET /api/clusters/similar/:articleId — find articles similar to a given one
app.get('/similar/:articleId', requireAuth, async (c) => {
  try {
    const articleId = parseInt(c.req.param('articleId'), 10)
    if (Number.isNaN(articleId)) return c.json({ error: 'Invalid article ID' }, 400)

    const limit = parseInt(c.req.query('limit') || '5', 10)
    const similar = await findSimilarArticles(articleId, Math.min(limit, 20))
    return c.json({ similar })
  } catch (error) {
    logger.error('Error finding similar articles:', error)
    return c.json({ error: 'Failed to find similar articles' }, 500)
  }
})

export default app
