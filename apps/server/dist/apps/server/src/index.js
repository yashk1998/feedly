"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.redis = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const express_2 = require("@clerk/express");
const winston_1 = __importDefault(require("winston"));
const node_cron_1 = __importDefault(require("node-cron"));
const feeds_1 = require("./services/feeds");
// Import routes
const feeds_2 = __importDefault(require("./routes/feeds"));
const articles_1 = __importDefault(require("./routes/articles"));
const ai_1 = __importDefault(require("./routes/ai"));
const teams_1 = __importDefault(require("./routes/teams"));
const payments_1 = __importDefault(require("./routes/payments"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const admin_1 = __importDefault(require("./routes/admin"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config();
// Initialize Prisma
exports.prisma = new client_1.PrismaClient();
// Initialize Redis
exports.redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
// Initialize Logger
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'combined.log' }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ]
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// trust proxy to ensure secure cookies when behind load balancers
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
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
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Clerk authentication middleware
app.use((0, express_2.clerkMiddleware)());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/feeds', feeds_2.default);
app.use('/api/articles', articles_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/teams', teams_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/admin', admin_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    exports.logger.error('Unhandled error:', err);
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
    node_cron_1.default.schedule('0 * * * *', async () => {
        exports.logger.info('Starting scheduled feed sync...');
        try {
            // Get all feeds that need refreshing (older than 1 hour)
            const feedsToRefresh = await feeds_1.feedService.getFeedsToRefresh('paid');
            exports.logger.info(`Found ${feedsToRefresh.length} feeds to refresh`);
            // Process feeds in batches to avoid overwhelming the system
            const batchSize = 10;
            for (let i = 0; i < feedsToRefresh.length; i += batchSize) {
                const batch = feedsToRefresh.slice(i, i + batchSize);
                await Promise.allSettled(batch.map(async (feedId) => {
                    try {
                        await feeds_1.feedService.refreshFeed(feedId);
                        exports.logger.debug(`Refreshed feed ${feedId}`);
                    }
                    catch (error) {
                        exports.logger.error(`Failed to refresh feed ${feedId}:`, error);
                    }
                }));
                // Small delay between batches to be nice to external servers
                if (i + batchSize < feedsToRefresh.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            exports.logger.info('Completed scheduled feed sync');
        }
        catch (error) {
            exports.logger.error('Error during scheduled feed sync:', error);
        }
    });
    exports.logger.info('Feed sync cron job scheduled (runs every hour)');
}
// Start server
async function startServer() {
    try {
        // Connect to Redis (optional)
        try {
            await exports.redis.connect();
            exports.logger.info('Connected to Redis');
        }
        catch (redisError) {
            exports.logger.warn('Redis connection failed, continuing without Redis:', redisError);
        }
        // Test database connection
        await exports.prisma.$connect();
        exports.logger.info('Connected to database');
        // Setup background feed sync
        setupFeedSyncCron();
        app.listen(PORT, () => {
            exports.logger.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        exports.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    exports.logger.info('SIGTERM received, shutting down gracefully');
    await exports.prisma.$disconnect();
    try {
        await exports.redis.disconnect();
    }
    catch (error) {
        exports.logger.warn('Redis disconnect failed:', error);
    }
    process.exit(0);
});
process.on('SIGINT', async () => {
    exports.logger.info('SIGINT received, shutting down gracefully');
    await exports.prisma.$disconnect();
    try {
        await exports.redis.disconnect();
    }
    catch (error) {
        exports.logger.warn('Redis disconnect failed:', error);
    }
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map