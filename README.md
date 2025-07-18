# 🌱 rivsy RSS SaaS

> AI-powered RSS feed reader with team collaboration, social media integration, and intelligent content curation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## 🚀 Features

### 📰 Core RSS Features
- **Smart Feed Aggregation**: Automatically parse RSS/Atom feeds and regular websites
- **Real-time Updates**: Configurable refresh intervals (1-hour to 6-hour based on plan)
- **Content Deduplication**: Global article deduplication using content checksums
- **Category Management**: Organize feeds by categories for better content discovery

### 🤖 AI-Powered Intelligence
- **Article Summarization**: Get instant AI-generated summaries powered by Azure OpenAI
- **Social Media Posts**: Auto-generate platform-specific posts for Twitter, LinkedIn, Reddit
- **Keyword Extraction**: Identify key topics and themes in articles
- **Sentiment Analysis**: Understand the emotional tone of content

### 👥 Team Collaboration
- **Multi-user Teams**: Share feeds and insights with team members
- **Role-based Access**: Owner, Editor, and Viewer roles with appropriate permissions
- **Slack Integration**: Send article summaries and updates to Slack channels
- **Shared Categories**: Collaborative content organization

### 💳 Flexible Pricing
- **Freemium Model**: Free tier with 5 AI credits/month
- **Pro Plan**: ₹299/month - 150 credits, 3 team members, social posting
- **Power Plan**: ₹599/month - 150 credits, 10 team members, all features
- **Credit System**: Transparent usage tracking with soft/hard limits

### 🔧 Technical Excellence
- **Modern Stack**: React 18, Node.js, TypeScript, MySQL, Redis
- **Authentication**: Clerk integration for secure user management
- **Payments**: Razorpay integration for Indian market
- **Analytics**: PostHog integration for user behavior tracking
- **API-First**: RESTful APIs with comprehensive documentation

## 🏗️ Architecture

```
rivsy/
├── apps/
│   ├── server/          # Node.js/Express backend
│   └── client/          # React/Vite frontend
├── packages/            # Shared packages (future)
├── prisma/             # Database schema and migrations
└── docs/               # Documentation
```

### Tech Stack

**Backend:**
- Node.js + Express.js
- TypeScript
- Prisma ORM + MySQL
- Redis for caching
- Azure OpenAI for AI features
- Clerk for authentication
- Razorpay for payments

**Frontend:**
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for data fetching
- Clerk for authentication
- Framer Motion for animations

**Infrastructure:**
- Azure VM for hosting
- MySQL database
- Redis cache
- PostHog for analytics
- Papercups for support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Redis 6+
- npm or yarn

### 1. Clone and Install

```bash
git clone <repository-url>
cd rivsy
npm run install:all
```

### 2. Environment Setup

**Backend (.env):**
```bash
cd apps/server
cp env.example .env
```

Edit `apps/server/.env` with your configuration:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/rivsy"
REDIS_URL="redis://localhost:6379"

# Authentication
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# AI Services
AZURE_OPENAI_API_KEY="your_azure_openai_key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"

# Payments
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_secret"

# Analytics
POSTHOG_API_KEY="phc_..."
```

**Frontend (.env.local):**
```bash
cd apps/client
cp env.example .env.local
```

Edit `apps/client/.env.local`:
```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:server  # Backend on :3001
npm run dev:client  # Frontend on :3000
```

Visit `http://localhost:3000` to see the application!

## 📚 Documentation

### API Documentation

The backend provides a comprehensive REST API. Key endpoints:

- **Feeds**: `/api/feeds` - CRUD operations for RSS feeds
- **Articles**: `/api/articles` - Article retrieval and management
- **AI**: `/api/ai/*` - AI-powered features (summarization, social posts)
- **Teams**: `/api/teams` - Team management and collaboration
- **Payments**: `/api/payments` - Subscription and billing

See [Backend README](apps/server/README.md) for detailed API documentation.

### Frontend Documentation

The React frontend provides a modern, responsive interface:

- **Dashboard**: Main article feed with filtering and search
- **Feed Management**: Add and manage RSS subscriptions
- **Article Reader**: Clean reading interface with AI features
- **Settings**: User preferences and account management

See [Frontend README](apps/client/README.md) for component documentation.

## 🧪 Testing

### Postman Collection

Import the provided Postman collection to test all API endpoints:

```bash
# Import rivsy_API.postman_collection.json into Postman
# Set environment variables:
# - base_url: http://localhost:3001
# - clerk_session_token: (get from browser dev tools)
```

### Manual Testing

1. **Create Account**: Sign up at `http://localhost:3000`
2. **Add Feeds**: Try popular feeds like TechCrunch, Hacker News
3. **Test AI Features**: Generate summaries and social posts
4. **Team Features**: Create a team and invite members (Pro plan)

## 🚀 Deployment

### Production Build

```bash
# Build both applications
npm run build

# Start production server
npm start
```

### Environment Variables

Ensure all production environment variables are set:

- Database connection strings
- API keys for external services
- Webhook URLs for payments
- CORS origins for frontend

### Azure VM Deployment

1. **Setup VM**: Ubuntu 20.04+ with Node.js, MySQL, Redis
2. **Clone Repository**: Deploy code to `/opt/rivsy`
3. **Install Dependencies**: Run `npm run install:all`
4. **Database Migration**: Run `npm run db:migrate`
5. **Process Manager**: Use PM2 for process management
6. **Reverse Proxy**: Configure Nginx for SSL and routing
7. **Monitoring**: Setup logging and health checks

## 🔧 Development

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with React rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Project Structure

```
rivsy/
├── apps/
│   ├── server/                 # Backend application
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Express middleware
│   │   │   └── utils/          # Utility functions
│   │   ├── prisma/            # Database schema
│   │   └── package.json
│   └── client/                # Frontend application
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── pages/          # Page components
│       │   ├── hooks/          # Custom hooks
│       │   └── utils/          # Utility functions
│       └── package.json
├── docs/                      # Project documentation
├── rivsy_API.postman_collection.json
└── package.json              # Root package.json
```

## 📊 Features Roadmap

### MVP (Current)
- ✅ RSS feed aggregation
- ✅ AI article summaries
- ✅ User authentication
- ✅ Basic team features
- ✅ Razorpay integration

### Phase 2
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Email digest automation
- [ ] Browser extension
- [ ] OPML import/export

### Phase 3
- [ ] Self-hosted option
- [ ] Advanced AI features (translation, categorization)
- [ ] Integration marketplace
- [ ] White-label solutions
- [ ] Enterprise SSO

## 🤝 Support

- **Documentation**: Check the READMEs in each app directory
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact team for enterprise inquiries

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **RSS Parsing**: feedparser for robust RSS/Atom parsing
- **AI Services**: Azure OpenAI for intelligent content processing
- **Authentication**: Clerk for seamless user management
- **UI Components**: Tailwind CSS and Lucide React for beautiful interfaces
- **Database**: Prisma for type-safe database operations

---

**Built with ❤️ for the modern content consumer** 