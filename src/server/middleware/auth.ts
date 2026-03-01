import { createMiddleware } from 'hono/factory'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

type AuthEnv = {
  Variables: {
    userId: string
    user: {
      id: string
      email: string
      name: string | null
    }
  }
}

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    c.set('userId', user.id)
    c.set('user', user)
    await next()
  } catch (error) {
    logger.error('Auth middleware error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.get('user')
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    logger.error('ADMIN_EMAIL environment variable is not set')
    return c.json({ error: 'Admin access not configured' }, 500)
  }

  if (user?.email !== adminEmail) {
    return c.json({ error: 'Admin access required' }, 403)
  }

  await next()
})
