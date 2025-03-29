# RSS Reader Backend

This is the backend service for the RSS Reader application.

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rss-reader

# JWT Configuration
JWT_SECRET=your-secure-secret-key

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### Required Environment Variables

- `PORT`: The port number the server will listen on (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `REDIS_URL`: Redis connection string

### Optional Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum number of requests per window
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `LOG_FILE_PATH`: Path to log file
- `FEED_UPDATE_INTERVAL`: Feed update interval in minutes
- `MAX_FEED_ITEMS`: Maximum number of items to store per feed

## Security Notes

1. Never commit the `.env` file to version control
2. Use strong, unique values for `JWT_SECRET`
3. Keep your MongoDB credentials secure
4. Use HTTPS in production
5. Regularly rotate your secrets

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Run tests:
```bash
npm test
```

4. Lint code:
```bash
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use secure values for all secrets
3. Enable HTTPS
4. Set up proper logging
5. Configure rate limiting
6. Use a process manager (e.g., PM2)

## API Documentation

The API documentation is available at `/api-docs` when running the server.

## Error Handling

The application uses a centralized error handling system. All errors are logged and appropriate responses are sent to the client.

## Logging

Logs are written to both console and file. In production, logs are written to the specified log file. 