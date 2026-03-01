import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'

const app = new Hono()

// GET /api/analytics/kpi
app.get('/kpi', requireAuth, async (c) => {
  const userId = c.get('userId')
  return c.json({ message: 'Analytics KPIs coming soon', userId })
})

export default app
