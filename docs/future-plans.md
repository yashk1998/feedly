# Syncd — Future Plans

> Comprehensive roadmap covering remaining rewrite phases, features inspired by FreshRSS & Folo, AI integration strategy, and long-term vision.

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Scaffolding | Done | Next.js 15 + Hono + Prisma + NextAuth + Tailwind v4 |
| Phase 2: Backend Migration | Done | All Express routes ported to Hono |
| Phase 3: Frontend Rebuild | Done | 9 pages, Sage+Ink+Coral theme, all components |
| Phase 4: Enhancement Features | **Done** | Waves 1-4 complete |
| Phase 5: Polish & Deploy | Partial | Dockerfile + VM deploy scripts done |

---

## Phase 4: Enhancement Features

### Wave 1 — Quick Wins (1-2 days each)

#### 4.1 OPML Export
- **What:** `GET /api/feeds/export-opml` generates XML from user's subscriptions
- **Where:** New endpoint in `src/server/routes/feeds.ts`, export button in `src/app/(app)/feeds/page.tsx`
- **Details:** OPML import already exists (lines 245-317 of feeds route). Export mirrors that structure — iterate user feeds grouped by category, output `<outline>` elements
- **Priority:** High — essential for feed portability

#### 4.2 AI Summary Caching
- **What:** Store generated AI summaries in DB so they're never regenerated for the same article
- **Where:** New `AiCache` Prisma model, check-before-call logic in `src/server/routes/ai.ts`
- **Schema:**
  ```
  model AiCache {
    id        Int      @id @default(autoincrement())
    articleId Int
    userId    String
    type      String   // 'summary' | 'keywords' | 'sentiment' | 'social-post'
    content   String   @db.Text
    model     String   // which AI model generated it
    createdAt DateTime @default(now())
    article   Article  @relation(fields: [articleId], references: [id])
    @@unique([articleId, userId, type])
  }
  ```
- **Priority:** High — cuts AI costs significantly

#### 4.3 Advanced Search with Operators
- **What:** Parse search queries like `intitle:react author:dan before:2025-01-01` into structured Prisma filters
- **Where:** New query parser utility in `src/lib/search-parser.ts`, update article list query in `src/server/routes/articles.ts`
- **Supported operators:**
  - `intitle:keyword` — search article titles
  - `author:name` — filter by author
  - `feed:name` — filter by feed title
  - `before:YYYY-MM-DD` / `after:YYYY-MM-DD` — date ranges
  - `is:read` / `is:unread` / `is:saved` — status filters
  - `label:tagname` — filter by user tags (after tagging is built)
  - Bare words → full-text search across title + summary
- **Inspiration:** FreshRSS search operators (intitle:, inurl:, author:, date:, #tag, label:)
- **Priority:** High — power-user feature that differentiates from basic readers

#### 4.4 Multiple View Modes
- **What:** Toggle between list/grid/compact views on the dashboard
- **Where:** View toggle buttons in `src/app/(app)/dashboard/page.tsx`, preference stored in localStorage
- **Views:**
  - **List** (current) — title + excerpt + metadata in vertical list
  - **Grid/Card** — 2-3 column card layout with thumbnails (inspired by Folo's Picture view)
  - **Compact** — dense list with title + source + time only (inspired by FreshRSS Normal view)
- **Inspiration:** FreshRSS (Normal/Global/Reader views), Folo (Article/Social/Picture/Video/Notification)
- **Priority:** Medium — improves UX for different content types

---

### Wave 2 — Medium Features (3-5 days each)

#### 4.5 Command Palette (Cmd+K)
- **What:** Global command palette for power users — search feeds, navigate pages, trigger actions
- **Where:** New component `src/components/ui/command-palette.tsx`, integrate in root layout
- **Library:** `cmdk` (same as Folo uses)
- **Actions:**
  - Navigate to any page (Dashboard, Feeds, Saved, Settings)
  - Search articles by title
  - Jump to specific feed
  - Toggle dark mode
  - Add new feed (opens modal)
  - Mark all as read
  - Open keyboard shortcuts help
- **Trigger:** `Cmd+K` (Mac) / `Ctrl+K` (Windows)
- **Inspiration:** Folo's command palette, Linear, Raycast

#### 4.6 Article Tagging System
- **What:** User-defined tags on articles (separate from feed categories)
- **Where:** New models + routes + UI in article cards and reader
- **Schema:**
  ```
  model Tag {
    id        Int          @id @default(autoincrement())
    name      String
    color     String       @default("#4D7C5B") // sage default
    userId    String
    user      User         @relation(fields: [userId], references: [id])
    articles  ArticleTag[]
    @@unique([userId, name])
  }

  model ArticleTag {
    id        Int      @id @default(autoincrement())
    articleId Int
    tagId     Int
    createdAt DateTime @default(now())
    article   Article  @relation(fields: [articleId], references: [id])
    tag       Tag      @relation(fields: [tagId], references: [id])
    @@unique([articleId, tagId])
  }
  ```
- **API:** `POST /api/tags`, `GET /api/tags`, `POST /api/articles/:id/tag`, `DELETE /api/articles/:id/tag/:tagId`
- **UI:** Tag pills on article cards, tag filter in sidebar, tag management in settings
- **Inspiration:** FreshRSS dual tagging (user labels + feed tags), both searchable

#### 4.7 Saved Searches
- **What:** Save any search/filter combination as a named query, pin it to the sidebar
- **Where:** New model + routes + sidebar section
- **Schema:**
  ```
  model SavedSearch {
    id        Int      @id @default(autoincrement())
    userId    String
    name      String
    query     String   // raw search string with operators
    filters   Json     // { category, feedId, unread, tags }
    isPinned  Boolean  @default(false)
    createdAt DateTime @default(now())
    user      User     @relation(fields: [userId], references: [id])
  }
  ```
- **Inspiration:** FreshRSS user queries that can be recalled via `search:myQuery` and shared as RSS feeds

#### 4.8 Multi-Provider AI Service
- **What:** Abstract AI service to support multiple providers, route by task type
- **Where:** Refactor `src/server/services/ai.ts` into provider pattern
- **Architecture:**
  ```
  src/server/services/ai/
  ├── index.ts          // AIService class with routing logic
  ├── providers/
  │   ├── base.ts       // Abstract AIProvider interface
  │   ├── openai.ts     // Azure OpenAI / OpenAI API
  │   ├── anthropic.ts  // Claude Haiku / Sonnet
  │   ├── gemini.ts     // Gemini Flash-Lite / Pro
  │   └── ollama.ts     // Local self-hosted models
  └── types.ts
  ```
- **Routing strategy:**
  | Task | Default Provider | Fallback |
  |------|-----------------|----------|
  | Summarization (batch) | Gemini 2.5 Flash-Lite | OpenAI GPT-4o-mini |
  | Summarization (on-demand) | Claude Haiku 4.5 | OpenAI GPT-4o-mini |
  | Categorization | Gemini Flash-Lite | Local (future) |
  | Sentiment | Gemini Flash-Lite | Local (future) |
  | Social posts | Claude Haiku 4.5 | OpenAI GPT-4o |
  | Embeddings | OpenAI text-embedding-3-small | — |
- **Also:** Token-aware content truncation (replace `.slice(0, 4000)`), structured output with JSON mode
- **Priority:** High — 80-95% cost reduction

#### 4.9 Auto-Detected View Types (Folo-inspired)
- **What:** Different rendering layouts based on feed content type
- **Where:** Feed metadata + per-feed view type override in `src/app/(app)/dashboard/page.tsx`
- **View types:**
  | Type | Auto-detect rule | Layout |
  |------|-----------------|--------|
  | Article | Default for blogs/news | List with excerpts |
  | Social | Short posts (<280 chars), no titles | Compact card stream |
  | Picture | >50% entries have images | Grid gallery |
  | Video | YouTube/Vimeo feeds | Thumbnail grid |
  | Notification | GitHub activity, alerts | Dense notification list |
- **Detection:** Analyze first 10 articles of a feed on subscribe, suggest view type
- **Inspiration:** Folo's 5 view types with smart detection

---

### Wave 3 — Complex Features (1-2 weeks each) — ALL DONE

#### 4.10 AI Summary at Top of Articles — DONE
- **What:** Auto-generate summaries for new articles during feed sync (background), display at top of article reader
- **Where:** Extend cron job in `src/app/api/cron/sync-feeds/route.ts`, display in `src/app/(app)/article/[id]/page.tsx`
- **Flow:**
  1. Feed sync fetches new articles
  2. Background job queues summarization for each new article
  3. Uses cheap model (Gemini Flash-Lite) for batch processing
  4. Stores in `AiCache` table
  5. Article reader checks cache first, shows "AI Summary" card at top
  6. Falls back to on-demand generation if cache miss
- **Inspiration:** Folo's most praised feature — AI summary displayed before full content
- **Cost:** ~$0.03/day per 1K articles with Gemini Flash-Lite batch API

#### 4.11 Topic Clustering ("Story Threads") — DONE
- **What:** Group related articles across feeds into topic clusters
- **Where:** New background job + new UI section on dashboard
- **How:**
  1. Generate embeddings for each article (OpenAI `text-embedding-3-small` at $0.02/1M tokens)
  2. Store in `ArticleEmbedding` table (articleId + vector)
  3. Run HDBSCAN clustering periodically (or use pg_vector similarity)
  4. Label clusters with a cheap LLM call
  5. Show "Story Threads" section on dashboard: "15 articles about the X topic"
- **Schema:**
  ```
  model ArticleEmbedding {
    id        Int      @id @default(autoincrement())
    articleId Int      @unique
    vector    Float[]  // 1536-dimensional for text-embedding-3-small
    article   Article  @relation(fields: [articleId], references: [id])
  }

  model TopicCluster {
    id        Int      @id @default(autoincrement())
    label     String
    articleIds Int[]
    createdAt DateTime @default(now())
    expiresAt DateTime // clusters are ephemeral, regenerated daily
  }
  ```
- **Inspiration:** Google News story grouping, Feedly topic tracking

#### 4.12 Feed Discovery & Source Library — DONE
- **What:** Searchable library of popular feeds, AI-powered suggestions, RSSHub integration
- **Where:** Enhanced `src/app/(app)/feeds/page.tsx` with discovery tab
- **Components:**
  1. **Curated directory** — Expanded from current 15 feeds to 200+ organized by category
  2. **Search API** — `GET /api/feeds/discover?q=...` searches the directory + web scraping
  3. **RSSHub integration** — Link to RSSHub routes for 900+ sources (Twitter, YouTube, Reddit, GitHub, TED, HN, etc.)
  4. **AI discovery** — "I'm interested in [topic]" → AI suggests relevant feeds
  5. **Feed health metrics** — Show update frequency, avg articles/week, last updated
- **Schema:**
  ```
  model FeedDirectory {
    id          Int      @id @default(autoincrement())
    url         String   @unique
    title       String
    description String?
    category    String
    language    String   @default("en")
    subscribers Int      @default(0)
    avgPostsPerWeek Float @default(0)
    lastChecked DateTime?
    isVerified  Boolean  @default(false)
  }
  ```
- **Inspiration:** Folo's RSSHub integration with 900+ sources, browsable catalog

#### 4.13 Daily AI Digest — DONE
- **What:** Automated daily/weekly email summarizing the user's most important unread articles
- **Where:** New cron route + email service
- **Flow:**
  1. Cron job runs daily at user's preferred time (from settings)
  2. Fetches user's unread articles from last 24h
  3. Ranks by engagement signals (feed priority, topic match)
  4. Generates a digest summary using AI (top 10 articles summarized)
  5. Sends via email (Resend or SendGrid)
  6. Stores digest in DB for web viewing
- **Schema:**
  ```
  model Digest {
    id           Int      @id @default(autoincrement())
    userId       String
    articleCount Int
    content      String   @db.Text // rendered HTML digest
    sentAt       DateTime?
    createdAt    DateTime @default(now())
    user         User     @relation(fields: [userId], references: [id])
  }
  ```
- **Inspiration:** Folo's AI Daily Digest, twice daily for high-volume feeds

#### 4.14 Smart Refresh Intervals (AutoTTL) — DONE
- **What:** Dynamically adjust feed poll frequency based on posting patterns
- **Where:** Update `src/server/services/feeds.ts` refresh logic
- **Algorithm:**
  - Track `avgPostsPerDay` for each feed
  - High-frequency feeds (>5 posts/day) → poll every 30min
  - Medium feeds (1-5 posts/day) → poll every 2h
  - Low-frequency feeds (<1 post/day) → poll every 6h
  - Dormant feeds (no posts in 7 days) → poll every 24h
  - Newly added feeds → poll every 1h for first week, then adapt
- **Schema change:** Add `avgPostsPerDay Float?` and `autoTtlMinutes Int?` to Feed model
- **Inspiration:** FreshRSS AutoTTL extension

#### 4.15 Article Translation — DONE
- **What:** Translate article title + content on demand
- **Where:** `POST /api/ai/translate` route, language dropdown in article reader header
- **Provider:** Azure AI (via multi-provider AI service — same as summarization). No external translation APIs.
- **Cache:** Translations cached in `AiCache` with type `translation-{lang}`
- **UI:** 12-language dropdown in article header, translated content replaces original with "Show original" toggle

---

### Wave 4 — Future Differentiators

#### 4.16 Newsletter Inbox — DEFERRED
- **What:** Consolidate email newsletters alongside RSS feeds
- **Requires:** External email receiving service (Mailgun/CloudMailin) — deferred until email infra is set up

#### 4.17 Actions & Automation (Per-Feed Rules) — DONE
- FeedAction model with 5 rule types: silence, notify, tag, webhook, translate
- `src/server/routes/actions.ts` — full CRUD
- `src/server/services/actions.ts` — executeActions() engine wired into cron job
- UI: expandable actions panel on each feed card in feeds page

#### 4.18 Interest Profile & Smart Ranking — DONE
- `src/server/services/ranking.ts` — builds user interest vector from read/saved article embeddings
- Weighted average: saved articles get 2x weight, cached in Redis for 1 hour
- `?sort=smart` parameter on articles API re-ranks by pgvector cosine similarity
- "Smart" toggle button on dashboard toolbar

#### 4.19 BYOK (Bring Your Own Key) — DONE
- `src/server/routes/api-keys.ts` — CRUD for user API keys (masked on read)
- AI service `getProviderForUser()` checks user keys before falling back to system
- Supports OpenAI, Anthropic, Google Gemini, Groq with custom model overrides
- Settings page → "API Keys" tab with add/toggle/delete UI

#### 4.20 Generate RSS from Search — DONE
- `GET /api/saved-searches/:id/rss?token=...` generates RSS 2.0 XML from search results
- HMAC token auth for RSS readers (no cookie support needed)
- `GET /api/saved-searches/:id/rss-url` returns the tokenized URL
- RSS icon on saved searches in dashboard sidebar copies URL to clipboard

---

## Phase 5: Polish & Deploy

### 5.1 Prisma Migration (MySQL → PostgreSQL)
- Fresh schema via `prisma migrate dev` with all new models from Phase 4
- One-time migration script: reads old MySQL → writes to new PostgreSQL
- Map old Clerk user IDs → new NextAuth cuid IDs

### 5.2 Dockerfile — DONE
- Multi-stage build: deps → builder → runner
- `output: "standalone"` in `next.config.ts`
- Includes Prisma client in standalone output
- See `Dockerfile` in project root

### 5.3 VM Deployment (local PostgreSQL + Redis)
- **Compute:** Azure B2s VM (~$30/mo) or AWS t3.small (~$15/mo)
- **Database:** PostgreSQL installed on VM (free, localhost)
- **Cache:** Redis installed on VM (free, localhost:6379)
- **App:** Next.js standalone via systemd service
- **Proxy:** Nginx reverse proxy with Let's Encrypt SSL
- **Cron:** System cron or Azure Logic App timer → `POST /api/cron/sync-feeds`
- **Deploy:** `bash deploy/deploy.sh user@vm-ip` — builds locally, ships to VM
- **Setup:** `sudo bash deploy/vm-setup.sh` on fresh Ubuntu VM
- **Why VM over Container App:** Running DB + Redis locally saves ~$40/mo in managed services

### 5.3b Alternative: Container App (if scaling needed later)
- If you outgrow the VM, switch to Azure Container App + managed PostgreSQL + managed Redis
- The Dockerfile is ready for this — just push to Azure Container Registry
- Estimated cost: ~$50-70/mo (container + managed DB + managed Redis)

### 5.4 AI Providers
- **Primary:** Azure OpenAI (GPT-4o / GPT-4o-mini)
- **Secondary:** AWS Bedrock (Claude Haiku 4.5, Llama, Titan)
- **Fallback:** Gemini Flash-Lite (cheapest), OpenAI direct
- Provider priority is configurable via environment variables
- See `.env.example` for all provider options

### 5.4 Testing & Verification Checklist
- [ ] Auth flow: sign up, sign in (email + Google + GitHub), sign out, protected redirects
- [ ] Feed CRUD: add, refresh, delete, OPML import, OPML export
- [ ] Articles: list, filter, search (with operators), read, save, fetch full content
- [ ] AI: summarize (cached), social post, keywords, sentiment, translate
- [ ] Cron: trigger sync, verify new articles + auto-summaries
- [ ] Views: list/grid/compact toggle, view type detection
- [ ] Tags: create, apply, filter, remove
- [ ] Command palette: Cmd+K opens, search works, actions execute
- [ ] Theme: light/dark on all pages, system preference sync
- [ ] Keyboard shortcuts: j/k/o/m/s navigation
- [ ] Mobile: sidebar collapse, touch targets, responsive layouts
- [ ] Performance: Lighthouse 90+ target
- [ ] Security: OWASP top 10 audit

---

## Infrastructure Backlog (from original backlog.md)

- Self-host PostHog for analytics
- Multi-region disaster recovery
- GDPR data-subject tooling (export, rectification, erasure)
- SSO/SAML & SCIM for enterprise
- Browser extension for quick subscription
- Admin impersonation for support
- Nightly backups with granular purging

---

## AI Cost Projections

Assuming 1,000 articles/day with all features enabled:

| Feature | Model | Daily Cost |
|---------|-------|------------|
| Auto-summarization (batch) | Gemini 2.5 Flash-Lite | ~$0.03 |
| Categorization | Gemini Flash-Lite | ~$0.02 |
| Keyword extraction | Gemini Flash-Lite | ~$0.02 |
| Embeddings | text-embedding-3-small | ~$0.02 |
| On-demand summaries (~50/day) | Claude Haiku 4.5 | ~$0.05 |
| Social posts (~20/day) | Claude Haiku 4.5 | ~$0.02 |
| Daily digests (~100 users) | Gemini Flash-Lite | ~$0.01 |
| **Total** | | **~$0.17/day (~$5/month)** |

vs. current Azure OpenAI GPT-4o for everything: ~$3-5/day (~$100+/month)

---

## Suggested Implementation Order

```
Week 1-2:   Wave 1 (OPML export, AI caching, advanced search, view modes)
Week 3-4:   Wave 2 (Cmd+K, tagging, saved searches, multi-provider AI)
Week 5-6:   Wave 3a (AI summaries at top, feed discovery, AutoTTL)
Week 7-8:   Wave 3b (topic clustering, daily digest, translation)
Week 9:     Phase 5 (Docker, Azure deploy, migration)
Week 10:    Testing, bug fixes, performance optimization
Week 11+:   Wave 4 features as demand warrants
```

---

*Last updated: March 2026*
