import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { rateLimit } from './middleware/rate-limit'
import authRoutes from './routes/auth'
import feedRoutes from './routes/feeds'
import articleRoutes from './routes/articles'
import aiRoutes from './routes/ai'
import tagRoutes from './routes/tags'
import savedSearchRoutes from './routes/saved-searches'
import teamRoutes from './routes/teams'
import paymentRoutes from './routes/payments'
import analyticsRoutes from './routes/analytics'
import adminRoutes from './routes/admin'
import clusterRoutes from './routes/clusters'
import actionRoutes from './routes/actions'
import apiKeyRoutes from './routes/api-keys'

const app = new Hono().basePath('/api')

// Logging middleware
app.use('*', honoLogger())

// Global rate limit: 200 requests per 15 minutes per IP+path
app.use('*', rateLimit(200, 15 * 60 * 1000))

// Stricter rate limit on auth routes: 10 requests per 15 minutes
app.use('/auth/*', rateLimit(10, 15 * 60 * 1000))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Mount routes
app.route('/auth', authRoutes)
app.route('/feeds', feedRoutes)
app.route('/articles', articleRoutes)
app.route('/ai', aiRoutes)
app.route('/tags', tagRoutes)
app.route('/saved-searches', savedSearchRoutes)
app.route('/teams', teamRoutes)
app.route('/payments', paymentRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/admin', adminRoutes)
app.route('/clusters', clusterRoutes)
app.route('/actions', actionRoutes)
app.route('/api-keys', apiKeyRoutes)

export default app
