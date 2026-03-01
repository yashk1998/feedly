import { Hono } from 'hono'
import { requireAuth, requireAdmin } from '../middleware/auth'

const app = new Hono()

// GET /api/admin/stats
app.get('/stats', requireAuth, requireAdmin, async (c) => {
  const userId = c.get('userId')
  return c.json({ message: 'Admin stats coming soon', userId })
})

export default app
