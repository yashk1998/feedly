# Syncd — Architecture

## System Overview

Syncd is a full-stack Next.js 15 application that aggregates RSS feeds, applies AI-powered analysis (summarization, embeddings, clustering), and serves a keyboard-driven reading interface. The entire application — frontend, API, and background jobs — runs as a single Next.js process.

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│  React 19 · Tailwind v4 · React Query · Framer Motion   │
└────────────────────────┬────────────────────────────────┘
                         │ fetch /api/*
┌────────────────────────▼────────────────────────────────┐
│                  Next.js 15 Server                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  App Router   │  │ Hono API     │  │ NextAuth v5   │  │
│  │  (pages/SSR)  │  │ (/api/*)     │  │ (JWT sessions)│  │
│  └──────────────┘  └──────┬───────┘  └───────────────┘  │
│                           │                              │
│  ┌────────────────────────▼─────────────────────────┐   │
│  │              Service Layer                        │   │
│  │  feeds · ai · credits · clustering · ranking      │   │
│  │  actions                                          │   │
│  └──────┬──────────┬──────────┬──────────┬──────┘   │
│         │          │          │          │            │
│    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌───▼────┐     │
│    │Prisma  │ │ Redis  │ │AI APIs │ │Razorpay│     │
│    │(PG+vec)│ │        │ │        │ │        │     │
│    └────────┘ └────────┘ └────────┘ └────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Request Lifecycle

1. **Browser** sends requests to Next.js
2. **Middleware** (`middleware.ts`) intercepts protected routes and checks the NextAuth session
3. **App Router** handles page requests (SSR/RSC) or delegates to the Hono catch-all at `src/app/api/[...route]/route.ts`
4. **Hono middleware** (`requireAuth`) validates the session and loads the user from PostgreSQL
5. **Route handler** processes the request, calling service layer functions
6. **Services** interact with PostgreSQL (via Prisma), Redis (caching), and external APIs (AI providers, Razorpay)
7. **Response** returns JSON to the client; React Query manages caching and refetching

## Directory Structure

```
syncd/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (app)/                    # Authenticated route group
│   │   │   ├── layout.tsx            # Shell: Navbar + CommandPalette
│   │   │   ├── dashboard/page.tsx    # Feed reader
│   │   │   ├── feeds/page.tsx        # Feed management + discovery
│   │   │   ├── article/[id]/page.tsx # Article reader
│   │   │   ├── saved/page.tsx        # Saved articles
│   │   │   ├── digest/page.tsx       # AI digest
│   │   │   ├── pricing/page.tsx      # Plans
│   │   │   └── settings/page.tsx     # Settings (5 tabs)
│   │   ├── (auth)/                   # Public auth pages
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   ├── api/
│   │   │   ├── [...route]/route.ts   # Hono catch-all
│   │   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   │   └── cron/sync-feeds/      # Cron job
│   │   ├── layout.tsx                # Root layout + metadata
│   │   ├── page.tsx                  # Landing page
│   │   ├── providers.tsx             # SessionProvider + QueryClient
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/                   # Navbar, Footer
│   │   └── ui/                       # CommandPalette, Skeleton, etc.
│   ├── hooks/
│   │   └── use-keyboard-shortcuts.ts
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth configuration
│   │   ├── prisma.ts                 # Prisma singleton
│   │   ├── redis.ts                  # Redis singleton (lazy connect)
│   │   ├── logger.ts                 # Winston logger
│   │   ├── api-client.ts            # Client-side fetch wrapper
│   │   └── search-parser.ts         # Search operator parser
│   ├── server/
│   │   ├── hono.ts                   # Hono app + route mounting
│   │   ├── middleware/auth.ts        # requireAuth, requireAdmin
│   │   ├── routes/                   # 13 route modules
│   │   └── services/                 # 6 service modules
│   └── types/
│       ├── index.ts                  # Shared interfaces
│       └── next-auth.d.ts            # Session type augmentation
├── prisma/schema.prisma
├── middleware.ts                      # NextAuth route matcher
├── next.config.ts
├── Dockerfile
└── deploy/
```

## Authentication

### Stack

- **NextAuth v5** with PrismaAdapter
- **Session strategy**: JWT (stateless, no DB session lookups on every request)
- **Providers**: Google OAuth, GitHub OAuth, Credentials (email + bcrypt)

### Flow

```
Browser                    Next.js                         PostgreSQL
  │                          │                                │
  │  POST /api/auth/signin   │                                │
  │─────────────────────────>│                                │
  │                          │  verify credentials / OAuth    │
  │                          │───────────────────────────────>│
  │                          │  user record                   │
  │                          │<───────────────────────────────│
  │  Set-Cookie: JWT         │                                │
  │<─────────────────────────│                                │
  │                          │                                │
  │  GET /api/articles       │                                │
  │  Cookie: JWT             │                                │
  │─────────────────────────>│                                │
  │                          │  decode JWT → userId           │
  │                          │  Prisma lookup → user obj      │
  │                          │───────────────────────────────>│
  │                          │                                │
```

### Route Protection

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| `middleware.ts` | NextAuth session check | `/dashboard/*`, `/feeds/*`, `/article/*`, `/saved/*`, `/settings/*` |
| `requireAuth` | Hono middleware, reads NextAuth session + DB lookup | All `/api/*` routes (except health, auth, webhooks) |
| `requireAdmin` | Checks `user.email === ADMIN_EMAIL` | `/api/admin/*` |

## API Layer

### Hono Architecture

All API routes are defined as Hono routers and mounted in `src/server/hono.ts`. Next.js delegates to Hono via a catch-all route at `src/app/api/[...route]/route.ts`.

```
Next.js catch-all
  └── Hono app
       ├── GET  /api/health
       ├── /api/auth/*        → auth routes
       ├── /api/feeds/*       → feed routes       (requireAuth)
       ├── /api/articles/*    → article routes     (requireAuth)
       ├── /api/ai/*          → AI routes          (requireAuth)
       ├── /api/tags/*        → tag routes         (requireAuth)
       ├── /api/saved-searches/* → search routes   (requireAuth)
       ├── /api/clusters/*    → cluster routes     (requireAuth)
       ├── /api/actions/*     → action routes      (requireAuth)
       ├── /api/api-keys/*    → BYOK routes        (requireAuth)
       ├── /api/teams/*       → team routes        (requireAuth)
       ├── /api/payments/*    → payment routes     (requireAuth)
       ├── /api/analytics/*   → analytics routes   (requireAuth)
       └── /api/admin/*       → admin routes       (requireAdmin)
```

### Route Modules

| File | Endpoints | Description |
|------|-----------|-------------|
| `routes/auth.ts` | 1 | User registration |
| `routes/feeds.ts` | 8 | Feed CRUD, refresh, OPML, discovery |
| `routes/articles.ts` | 9 | Article listing, read/unread, save, full content fetch |
| `routes/ai.ts` | 8 | Summarize, social post, keywords, sentiment, translate, digest |
| `routes/tags.ts` | 7 | Tag CRUD, article tagging |
| `routes/saved-searches.ts` | 5 | Saved search CRUD, RSS export |
| `routes/clusters.ts` | 2 | Topic clusters, similar articles |
| `routes/actions.ts` | 5 | Feed automation rules |
| `routes/api-keys.ts` | 4 | BYOK API key management |
| `routes/teams.ts` | 4 | Team management |
| `routes/payments.ts` | 4 | Razorpay subscription lifecycle |
| `routes/analytics.ts` | 3 | Dashboard KPIs |
| `routes/admin.ts` | 4 | System stats, user management |

## Service Layer

### FeedService (`services/feeds.ts`)

Handles feed discovery, parsing, and article storage.

```
User adds feed URL
  │
  ▼
getOrCreateFeed(url)
  ├── Check if feed exists in DB
  ├── parseFeed(url)
  │     ├── Try RSS/Atom via feedparser
  │     └── Fallback: scrape with @mozilla/readability
  ├── Create Feed record
  └── storeArticles(feedId, articles)
        ├── SHA-256 checksum per article
        ├── Skip duplicates (feedId + guid unique)
        └── Insert new articles

refreshFeed(feedId)
  ├── parseFeed(feed.url)
  ├── storeArticles(feedId, newArticles)
  ├── Record refresh timestamp in Redis
  └── Return new article IDs

getFeedsToRefresh(planType)
  └── Respects per-feed autoTtlMinutes
```

Key features:
- **Adaptive TTL**: `detectViewType` analyzes 10 recent articles to classify feeds as `article | social | picture | video | notification`
- **Full content extraction**: 3-strategy UA rotation for fetching full articles via `@mozilla/readability`
- **OPML**: Standard import/export for feed portability

### AIService (`services/ai.ts`)

Multi-provider AI abstraction with caching and credit accounting.

```
AI Request
  │
  ▼
getProviderForUser(userId, task)
  ├── Check UserApiKey table (BYOK)
  └── Fallback: system provider chain
       ├── 1. Azure OpenAI
       ├── 2. AWS Bedrock
       ├── 3. Google Gemini
       └── 4. OpenAI Direct

  │
  ▼
Check AiCache (articleId + userId + type)
  ├── Cache hit → return cached result
  └── Cache miss
       ├── canUseAI(userId) → check credit limit
       ├── Call AI provider
       ├── Store in AiCache
       └── useCredit(userId)
```

Capabilities:
- `summarizeArticle` — article summary
- `generateSocialPost` — platform-specific posts (twitter/linkedin/reddit)
- `extractKeywords` — key topic extraction
- `analyzeSentiment` — emotional tone analysis
- `translateArticle` — 12 target languages
- `generateDigest` — multi-article daily summary
- `generateEmbedding` — 1536-dim vectors for similarity

### CreditsService (`services/credits.ts`)

Monthly credit cycle tracking.

| Plan | Credits/month | Hard Ceiling |
|------|---------------|-------------|
| Free | 5 | 180 |
| Pro | 150 | 180 |
| Power | 150 | 180 |

- `canUseAI(userId)` checks credit availability
- `useCredit(userId)` increments usage, warns if over plan limit but under ceiling
- Credits reset monthly based on `cycleStart`/`cycleEnd` in `AiCredits` table

### ClusteringService (`services/clustering.ts`)

Vector-based article grouping using pgvector.

```
generateMissingEmbeddings(maxArticles)
  ├── Query articles from last 48h without embeddings
  ├── Batch (20 at a time) → AI embedding generation
  └── Raw SQL INSERT into article_embeddings (vector(1536))

generateTopicClusters()
  ├── Cosine similarity query (threshold ≥ 0.78, 48h window)
  ├── Union-find grouping of similar articles
  ├── AI-generated labels per cluster
  └── Store with 24h TTL in TopicCluster table

findSimilarArticles(articleId, limit)
  └── pgvector cosine distance query (threshold > 0.7)
```

### RankingService (`services/ranking.ts`)

Interest-vector based article ranking.

```
getUserInterestVector(userId)
  ├── Fetch embeddings for read + saved articles
  ├── Weighted average (saved = 2x weight)
  ├── Cache in Redis for 1 hour
  └── Return 1536-dim vector

smartRankArticles(userId, articleIds)
  ├── Get user interest vector
  ├── Get article embeddings
  ├── Compute cosine distances
  └── Return articleIds sorted by relevance
```

### ActionsService (`services/actions.ts`)

Feed automation engine that runs on newly fetched articles.

```
executeActions(feedId, newArticleIds)
  ├── Query all enabled FeedAction records for feedId
  └── For each action:
       ├── silence  → auto-mark articles as read
       ├── notify   → keyword match → optional webhook
       ├── tag      → apply tag to matching articles
       ├── webhook  → POST article payload (10s timeout)
       └── translate → flag for on-demand translation
```

## Database

### PostgreSQL + pgvector

The database uses PostgreSQL with the `vector` extension for embedding storage and similarity search.

### Entity Relationship Overview

```
User ──┬── Account (OAuth)
       ├── Session
       ├── Subscription ──── Feed ──── Article ──┬── ArticleRead
       ├── Team ── TeamMember                    ├── SavedArticle
       ├── Payment                               ├── AiCache
       ├── AiCredits                             ├── ArticleTag ── Tag
       ├── SocialToken                           └── ArticleEmbedding
       ├── Tag
       ├── SavedSearch
       ├── Digest
       └── UserApiKey

Feed ── FeedAction
Feed ── Subscription

FeedDirectory (standalone catalog)
TopicCluster (standalone, references article IDs)
AdminLog (standalone audit)
```

### Models (21 total)

| Model | Table | Purpose |
|-------|-------|---------|
| User | `users` | User accounts |
| Account | `accounts` | OAuth provider accounts |
| Session | `sessions` | NextAuth sessions |
| VerificationToken | `verification_tokens` | Email verification |
| Team | `teams` | Multi-user teams |
| TeamMember | `team_members` | Team membership (owner/editor/viewer) |
| Feed | `feeds` | RSS feed sources |
| Subscription | `subscriptions` | User-to-feed link with category |
| Article | `articles` | Feed articles with content |
| ArticleRead | `article_reads` | Read status per user |
| SavedArticle | `saved_articles` | Bookmarked articles |
| AiCredits | `ai_credits` | Monthly credit usage |
| AiCache | `ai_cache` | Cached AI results per (article, user, type) |
| SocialToken | `social_tokens` | OAuth tokens for social posting |
| Payment | `payments` | Razorpay subscription records |
| AdminLog | `admin_logs` | Admin action audit trail |
| Tag | `tags` | User-defined tags |
| ArticleTag | `article_tags` | Article-tag assignments |
| SavedSearch | `saved_searches` | Named searches with filters |
| Digest | `digests` | Generated daily digests |
| FeedAction | `feed_actions` | Feed automation rules |
| UserApiKey | `user_api_keys` | BYOK API keys (encrypted) |
| FeedDirectory | `feed_directory` | Curated feed catalog |
| ArticleEmbedding | `article_embeddings` | vector(1536) embeddings |
| TopicCluster | `topic_clusters` | AI-labeled topic groups |

### Key Indexes

- `articles.checksum` — deduplication lookups
- `articles.publishedAt` — chronological sorting
- `articles(feedId, guid)` — unique constraint per feed
- `feed_directory.category` — directory browsing
- `topic_clusters.expiresAt` — TTL cleanup

## Cron Job

**Endpoint**: `POST /api/cron/sync-feeds`
**Auth**: `Authorization: Bearer CRON_SECRET`

Runs the full background pipeline in a single invocation:

```
1. Determine feeds due for refresh
   └── Respects per-feed autoTtlMinutes

2. Refresh feeds (batches of 10)
   └── Parse → store → dedup articles

3. Execute feed actions on new articles
   └── silence / notify / tag / webhook / translate

4. Batch summarize (up to 50 articles)
   └── Cache in AiCache

5. Update adaptive TTLs
   └── Recalculate autoTtlMinutes from posting frequency

6. Generate embeddings (up to 50 articles)
   └── Insert into article_embeddings

7. Generate/update topic clusters
   └── Cosine similarity → union-find → AI labels
```

**Response**:
```json
{
  "message": "Feed sync complete",
  "total": 42,
  "refreshed": 38,
  "failed": 4,
  "summarized": 50,
  "embedded": 50,
  "clustered": 12
}
```

## Caching Strategy

| Data | Store | TTL | Purpose |
|------|-------|-----|---------|
| AI results | PostgreSQL (`AiCache`) | Permanent | Avoid re-generating summaries |
| Feed refresh timestamps | Redis | Per-feed TTL | Prevent over-fetching |
| User interest vectors | Redis | 1 hour | Smart ranking cache |
| Topic clusters | PostgreSQL | 24 hours | Auto-expires via `expiresAt` |
| NextAuth sessions | JWT (cookie) | Session lifetime | Stateless auth |

## Frontend Architecture

### Data Fetching

All client-side data fetching uses **TanStack React Query v5** with the thin `api-client.ts` wrapper. Query keys follow a consistent pattern for cache invalidation.

### Search System

The search parser (`lib/search-parser.ts`) supports operators:

| Operator | Example | Maps to |
|----------|---------|---------|
| `intitle:` | `intitle:AI` | Prisma `title.contains` |
| `author:` | `author:Smith` | Prisma `author.contains` |
| `feed:` | `feed:Tech` | Join on Feed `title.contains` |
| `before:` | `before:2024-01-01` | `publishedAt < date` |
| `after:` | `after:2024-06-01` | `publishedAt > date` |
| `is:read` | `is:read` | Join on `ArticleRead` exists |
| `is:unread` | `is:unread` | Join on `ArticleRead` not exists |
| `is:saved` | `is:saved` | Join on `SavedArticle` exists |

Free text terms match against `title`, `content`, and `author` via Prisma `OR` conditions.

### Keyboard Navigation

The `useArticleNavigation` hook provides vim-style navigation (`j`/`k`) with automatic scroll-into-view. The `useKeyboardShortcuts` hook handles global shortcuts (`Cmd+K`, `?`, `s`, `m`).

## Deployment

### Docker (3-stage build)

```dockerfile
Stage 1: deps     → npm ci + copy prisma schema
Stage 2: builder  → prisma generate + next build
Stage 3: runner   → Node 20 Alpine, standalone output, non-root user
```

Produces a minimal image (~150MB) with only the standalone Next.js output.

### VM Deployment

**Target**: Ubuntu 22.04/24.04 on any cloud provider.

`deploy/vm-setup.sh` provisions:
1. System packages (Nginx, certbot, ufw)
2. Node.js 20 (via NodeSource)
3. PostgreSQL + pgvector extension
4. Redis (localhost-only)
5. App user `syncd` at `/opt/syncd`
6. Nginx reverse proxy (port 80/443 → 3000)
7. Systemd service with security hardening

`deploy/deploy.sh` handles updates:
1. Build locally (`next build`)
2. Tar standalone output
3. SCP to VM at `/opt/syncd`
4. SSH: extract, run `prisma migrate deploy`, restart service

### Infrastructure Diagram

```
┌──────────────┐
│   Internet   │
└──────┬───────┘
       │ HTTPS (443)
┌──────▼───────┐
│    Nginx     │
│  (SSL term)  │
└──────┬───────┘
       │ :3000
┌──────▼───────┐     ┌────────────┐     ┌─────────────┐
│  Next.js     │────>│ PostgreSQL │     │    Redis     │
│  (standalone)│     │ + pgvector │     │ (localhost)  │
└──────┬───────┘     └────────────┘     └─────────────┘
       │
       │ HTTPS
┌──────▼───────────────────────────┐
│         External APIs            │
├──────────────────────────────────┤
│ Azure OpenAI · AWS Bedrock       │
│ Google Gemini · OpenAI           │
│ Razorpay · Google/GitHub OAuth   │
└──────────────────────────────────┘
```

## Security

- **Authentication**: NextAuth v5 with JWT sessions, bcrypt password hashing (12 rounds)
- **Route protection**: Middleware-level session checks + Hono-level auth middleware
- **Admin access**: Email-based check against `ADMIN_EMAIL` env var
- **BYOK keys**: Stored encrypted in `user_api_keys` table
- **HTML sanitization**: DOMPurify on all rendered article content
- **HMAC tokens**: Saved search RSS feeds use HMAC-signed URLs
- **Cron authentication**: Bearer token via `CRON_SECRET`
- **Webhook verification**: Razorpay signature validation via `X-Razorpay-Signature`
- **Content checksums**: SHA-256 deduplication prevents injection of duplicate articles
