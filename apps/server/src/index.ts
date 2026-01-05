import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { clerkMiddleware } from '@clerk/express';
import winston from 'winston';
import cron from 'node-cron';
import { feedService } from './services/feeds';

// Import routes
import feedRoutes from './routes/feeds';
import articleRoutes from './routes/articles';
import aiRoutes from './routes/ai';
import teamRoutes from './routes/teams';
import paymentRoutes from './routes/payments';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Redis
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize Logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3001;

// trust proxy to ensure secure cookies when behind load balancers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk authentication middleware
app.use(clerkMiddleware());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/feeds', feedRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Background feed sync job
function setupFeedSyncCron() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting scheduled feed sync...');

    try {
      // Get all feeds that need refreshing (older than 1 hour)
      const feedsToRefresh = await feedService.getFeedsToRefresh('paid');

      logger.info(`Found ${feedsToRefresh.length} feeds to refresh`);

      // Process feeds in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < feedsToRefresh.length; i += batchSize) {
        const batch = feedsToRefresh.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (feedId) => {
            try {
              await feedService.refreshFeed(feedId);
              logger.debug(`Refreshed feed ${feedId}`);
            } catch (error) {
              logger.error(`Failed to refresh feed ${feedId}:`, error);
            }
          })
        );

        // Small delay between batches to be nice to external servers
        if (i + batchSize < feedsToRefresh.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('Completed scheduled feed sync');
    } catch (error) {
      logger.error('Error during scheduled feed sync:', error);
    }
  });

  logger.info('Feed sync cron job scheduled (runs every hour)');
}

// Start server
async function startServer() {
  try {
    // Connect to Redis (optional)
    try {
      await redis.connect();
      logger.info('Connected to Redis');
    } catch (redisError) {
      logger.warn('Redis connection failed, continuing without Redis:', redisError);
    }

    // Test database connection
    await prisma.$connect();
    logger.info('Connected to database');

    // Setup background feed sync
    setupFeedSyncCron();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  try {
    await redis.disconnect();
  } catch (error) {
    logger.warn('Redis disconnect failed:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  try {
    await redis.disconnect();
  } catch (error) {
    logger.warn('Redis disconnect failed:', error);
  }
  process.exit(0);
});

startServer(); 