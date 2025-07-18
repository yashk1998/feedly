# rivsy Server

Express.js backend for the rivsy RSS SaaS application.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   Fill in the required values in `.env`

3. **Set up database**:
   - Install MySQL 8.0
   - Create database: `CREATE DATABASE rivsy;`
   - Run migrations: `npx prisma db push`

4. **Set up Redis**:
   - Install Redis
   - Start Redis server: `redis-server`

5. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- All endpoints require Clerk authentication except `/health` and `/api/payments/webhook`

### Feeds
- `GET /api/feeds` - Get user's subscribed feeds
- `POST /api/feeds` - Subscribe to new feed
- `PUT /api/feeds/:id` - Update feed subscription
- `DELETE /api/feeds/:id` - Unsubscribe from feed

### Articles
- `GET /api/articles` - Get articles with pagination
- `GET /api/articles/:id` - Get single article
- `POST /api/articles/mark-read` - Mark articles as read
- `POST /api/articles/:id/unread` - Mark article as unread

### AI Features
- `GET /api/ai/credits` - Get AI credit usage
- `POST /api/ai/summarize` - Summarize article (costs 1 credit)
- `POST /api/ai/social-post` - Generate social media post
- `POST /api/ai/extract-keywords` - Extract keywords
- `POST /api/ai/sentiment` - Analyze sentiment

### Teams (Coming Soon)
- `GET /api/teams` - Team management

### Payments
- `POST /api/payments/webhook` - Razorpay webhook
- `GET /api/payments/plans` - Get available plans

### Analytics
- `GET /api/analytics/kpi` - Get user KPIs

### Admin (Admin only)
- `GET /api/admin/stats` - Get admin statistics

## Environment Variables

See `env.example` for all required environment variables.

## Database Schema

The application uses Prisma ORM with MySQL. See `prisma/schema.prisma` for the complete schema.

## Architecture

- **Express.js** - Web framework
- **Prisma** - Database ORM
- **Redis** - Caching and sessions
- **Clerk** - Authentication
- **Azure OpenAI** - AI features
- **Razorpay** - Payments
- **Winston** - Logging

## Development

Run in development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## Deployment

1. Set up Azure VM with Node.js, MySQL, and Redis
2. Configure environment variables
3. Run database migrations
4. Start the application with PM2 or similar process manager 