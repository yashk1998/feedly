const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const config = require('./config/config');
const { logger } = require('./utils/logger');
const { connect: connectRedis } = require('./services/redisService');

const authRoutes = require('./routes/authRoutes');
const feedRoutes = require('./routes/feedRoutes');
const userRoutes = require('./routes/userRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

// Initialize Redis and MongoDB connections
const initializeConnections = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');

    // Start the server
    app.listen(config.server.port, () => {
      logger.info(`Server is running on port ${config.server.port}`);
    });
  } catch (error) {
    logger.error('Failed to initialize connections:', error);
    process.exit(1);
  }
};

initializeConnections();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
}); 