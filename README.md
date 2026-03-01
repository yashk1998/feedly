# Syncd

> AI-powered RSS feed reader with smart ranking, topic clustering, and team collaboration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791)](https://www.postgresql.org/)

## Features

### Core RSS
- **Feed Aggregation** — parse RSS/Atom feeds and scrape regular websites via `@mozilla/readability`
- **Auto-refresh** — configurable per-feed TTL with adaptive scheduling based on posting frequency
- **Deduplication** — SHA-256 content checksums prevent duplicate articles
- **OPML Import/Export** — bring your feeds from any reader
- **Feed Directory** — discover curated feeds by category

### AI Intelligence
- **Multi-provider AI** — Azure OpenAI, AWS Bedrock, Google Gemini, OpenAI (automatic fallback)
- **BYOK** — bring your own API keys for OpenAI, Anthropic, Google, or Groq
- **Article Summarization** — instant AI summaries with per-user caching
- **Social Post Generation** — platform-specific posts for Twitter, LinkedIn, Reddit
- **Keyword Extraction & Sentiment Analysis**
- **Translation** — translate articles into 12 languages
- **Daily Digest** — AI-generated summary of your unread articles
- **Smart Ranking** — interest-vector ranking via pgvector embeddings
- **Topic Clustering** — automatic grouping of related articles

### Feed Automation
- **Silence** — auto-mark articles as read
- **Notify** — keyword-based alerts with optional webhook
- **Auto-tag** — apply tags to incoming articles
- **Webhook** — forward article payloads to external URLs
- **Translate** — flag articles for on-demand translation

### Search
- **Operator Syntax** — `intitle:`, `author:`, `feed:`, `before:`, `after:`, `is:read`, `is:unread`, `is:saved`
- **Saved Searches** — pin frequent searches, export as RSS feeds with HMAC tokens
- **Command Palette** — `Cmd+K` for instant navigation and search

### Team Collaboration
- **Multi-user Teams** — share feeds with team members
- **Role-based Access** — Owner, Editor, Viewer permissions
- **Slack Integration** — send updates to Slack channels

### Payments
- **Razorpay Integration** — subscription billing for Indian market
- **Credit System** — transparent AI usage tracking with plan-based limits

| Plan | Price | AI Credits/mo | Team Members |
|------|-------|---------------|--------------|
| Free | ₹0 | 5 | 1 |
| Pro | ₹299/mo | 150 | 3 |
| Power | ₹599/mo | 150 | 10 |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, standalone output) |
| UI | React 19, Tailwind CSS v4, Framer Motion, Lucide React |
| API | Hono v4 (mounted at `/api/[...route]`) |
| Auth | NextAuth v5 (Google, GitHub, Credentials) |
| Database | PostgreSQL + pgvector |
| ORM | Prisma 6 |
| Cache | Redis |
| AI | Azure OpenAI / AWS Bedrock / Google Gemini / OpenAI |
| Payments | Razorpay |
| Logging | Winston |
| Validation | Zod |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ with [pgvector](https://github.com/pgvector/pgvector) extension
- Redis 6+

### 1. Clone and Install

```bash
git clone <repository-url>
cd syncd
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration. See `.env.example` for all available variables:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/syncd
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
REDIS_URL=redis://localhost:6379

# OAuth (at least one provider)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI (at least one provider)
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
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
npm run dev
```

Visit `http://localhost:3000`.

## Project Structure

```
syncd/
├── src/
│   ├── app/
│   │   ├── (app)/                    # Authenticated routes
│   │   │   ├── dashboard/            # Main feed reader
│   │   │   ├── feeds/                # Feed management + discovery
│   │   │   ├── article/[id]/         # Article reader
│   │   │   ├── saved/                # Saved articles
│   │   │   ├── digest/               # AI daily digest
│   │   │   ├── pricing/              # Plans & pricing
│   │   │   └── settings/             # User settings (5 tabs)
│   │   ├── (auth)/                   # Sign-in / sign-up
│   │   ├── api/
│   │   │   ├── [...route]/           # Hono catch-all
│   │   │   ├── auth/[...nextauth]/   # NextAuth
│   │   │   └── cron/sync-feeds/      # Cron endpoint
│   │   └── providers.tsx             # Session + QueryClient + Toaster
│   ├── components/
│   │   ├── layout/                   # Navbar, Footer
│   │   └── ui/                       # Command palette, skeletons, etc.
│   ├── hooks/                        # Keyboard shortcuts
│   ├── lib/                          # Auth, Prisma, Redis, logger, search parser
│   ├── server/
│   │   ├── hono.ts                   # Hono app + route mounting
│   │   ├── middleware/               # Auth middleware
│   │   ├── routes/                   # API route handlers
│   │   └── services/                 # Business logic
│   └── types/                        # TypeScript definitions
├── prisma/schema.prisma              # 21 models, pgvector
├── deploy/                           # deploy.sh, vm-setup.sh
├── Dockerfile                        # 3-stage Node 20 Alpine build
├── middleware.ts                      # NextAuth route protection
└── package.json
```

## API Overview

All API routes are served via Hono at `/api/*`. See the [Postman collection](feedly_postman_collection.json) for complete request/response examples.

| Group | Base Path | Key Endpoints |
|-------|-----------|---------------|
| Auth | `/api/auth` | Register |
| Feeds | `/api/feeds` | CRUD, refresh, OPML import/export, discover |
| Articles | `/api/articles` | List, read/unread, save/unsave, fetch content, bulk mark read |
| AI | `/api/ai` | Summarize, social post, keywords, sentiment, translate, digest, credits |
| Tags | `/api/tags` | CRUD, tag/untag articles, articles by tag |
| Saved Searches | `/api/saved-searches` | CRUD, RSS export with HMAC |
| Clusters | `/api/clusters` | Topic clusters, similar articles |
| Actions | `/api/actions` | Feed automation rules |
| API Keys | `/api/api-keys` | BYOK key management |
| Teams | `/api/teams` | Team CRUD, members |
| Payments | `/api/payments` | Subscribe, cancel, webhook |
| Admin | `/api/admin` | System stats, user management |
| Analytics | `/api/analytics` | Dashboard KPIs, reading analytics |
| Health | `/api/health` | Server health check |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `↓` | Next article |
| `k` / `↑` | Previous article |
| `o` / `Enter` | Open article |
| `m` / `Space` | Toggle read/unread |
| `s` | Save/unsave article |
| `?` | Keyboard shortcuts help |
| `Cmd+K` | Command palette |

## Deployment

### Docker

```bash
docker build -t syncd .
docker run -p 3000:3000 --env-file .env syncd
```

### VM Deployment

```bash
# First-time VM setup (Ubuntu 22.04+)
bash deploy/vm-setup.sh

# Deploy updates
bash deploy/deploy.sh
```

The deploy script builds locally, transfers the standalone output via SCP, runs migrations, and restarts the systemd service.

### Production Build

```bash
npm run build
npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix lint errors |
| `npm run typecheck` | TypeScript type checking |
| `npm run check` | Lint + typecheck |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

See [architecture.md](architecture.md) for detailed system architecture documentation.

## License

MIT
