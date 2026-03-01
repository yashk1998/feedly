import { createClient } from 'redis'
import { logger } from '@/lib/logger'

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

function createRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })

  client.on('error', (err) => {
    logger.warn('Redis client error:', err)
  })

  return client
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

let isConnected = false

export async function getRedis() {
  if (!isConnected) {
    try {
      await redis.connect()
      isConnected = true
      logger.info('Connected to Redis')
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error)
    }
  }
  return redis
}
