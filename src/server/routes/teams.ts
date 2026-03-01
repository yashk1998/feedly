import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'

const app = new Hono()

// GET /api/teams
app.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  return c.json({ message: 'Teams feature coming soon', userId })
})

export default app
