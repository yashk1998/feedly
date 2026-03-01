export interface Tag {
  id: number
  name: string
  color: string
  articleCount?: number
}

export interface Article {
  id: number
  title: string | null
  summary: string | null
  content: string | null
  url: string | null
  publishedAt: string | null
  author: string | null
  readAt: string | null
  isRead: boolean
  isSaved: boolean
  savedAt: string | null
  tags?: Tag[]
  feed: {
    id: number
    title: string | null
    siteUrl: string | null
  }
}

export interface Feed {
  id: number
  subscriptionId: number
  url: string
  title?: string | null
  siteUrl?: string | null
  category: string
  viewType?: string | null
  lastFetchedAt: string | null
  unreadCount: number
  totalArticles: number
  isTeamFeed: boolean
  isActive: boolean
}

export interface SavedSearch {
  id: number
  name: string
  query: string
  filters?: {
    category?: string
    feedId?: number
    unread?: boolean
    tags?: number[]
  }
  isPinned: boolean
  createdAt: string
}

export interface CreditUsage {
  used: number
  limit: number
  remaining: number
  cycleEnd: string
  plan: 'free' | 'pro' | 'power'
}

export interface TopicCluster {
  id: number
  label: string
  articleCount: number
  score: number
  createdAt: string
  expiresAt: string
  articles: {
    id: number
    title: string | null
    url: string | null
    publishedAt: string | null
    author: string | null
    feedTitle: string | null
    feedSiteUrl: string | null
  }[]
}

export interface SimilarArticle {
  id: number
  title: string | null
  url: string | null
  feedTitle: string | null
  similarity: number
}

export interface FeedAction {
  id: number
  feedId: number
  feedTitle?: string | null
  feedUrl?: string
  type: 'silence' | 'notify' | 'tag' | 'webhook' | 'translate'
  config: Record<string, any>
  isEnabled: boolean
  createdAt: string
}

export interface UserApiKey {
  id: number
  provider: string
  model: string | null
  isActive: boolean
  createdAt: string
  hasKey: boolean
}

export interface PaginatedResponse<T> {
  articles: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
