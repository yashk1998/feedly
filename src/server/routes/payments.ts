import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'

const app = new Hono()

// POST /api/payments/webhook
app.post('/webhook', async (c) => {
  return c.json({ message: 'Webhook received' })
})

// GET /api/payments/plans
app.get('/plans', requireAuth, async (c) => {
  const userId = c.get('userId')
  return c.json({ message: 'Plans endpoint coming soon', userId })
})

export default app
