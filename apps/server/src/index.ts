import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { clerkMiddleware } from '@clerk/express';
import winston from 'winston';

// Import routes
import feedRoutes from './routes/feeds';
import articleRoutes from './routes/articles';
import aiRoutes from './routes/ai';
import teamRoutes from './routes/teams';
import paymentRoutes from './routes/payments';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';

// Load environment variables
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

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
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