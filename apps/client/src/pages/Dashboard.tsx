import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Clock,
  ExternalLink,
  Sparkles,
  Check,
  ChevronRight,
  Inbox,
  Filter,
  RefreshCw,
  BookOpen,
  Bookmark,
  Keyboard
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useApiClient } from '../lib/apiClient'
import { useArticleNavigation } from '../hooks/useKeyboardShortcuts'
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal'

interface Article {
  id: number
  title: string | null
  summary: string | null
  url: string | null
  publishedAt: string | null
  readAt: string | null
  isRead: boolean
  isSaved: boolean
  savedAt: string | null
  feed: {
    id: number
    title: string | null
    siteUrl: string | null
  }
}

interface Feed {
  id: number
  title?: string | null
  url: string
  unreadCount: number
  category: string
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(true)
  const [selectedFeed, setSelectedFeed] = useState<number | null>(null)
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0)
  const api = useApiClient()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch articles
  const { data: articlesResponse, isLoading: articlesLoading, refetch: refetchArticles } = useQuery(
    ['articles', { search: searchQuery, category: selectedCategory, unread: showUnreadOnly, feedId: selectedFeed }],
    async () => {
      const response = await api.get('/articles', {
        params: {
          search: searchQuery || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          unread: showUnreadOnly ? 'true' : undefined,
          feedId: selectedFeed || undefined,
          limit: 50
        }
      })
      return response.data as { articles: Article[]; pagination: { total: number } }
    },
    { refetchInterval: 60000 }
  )

  // Fetch feeds for sidebar
  const { data: feeds } = useQuery('feeds', async () => {
    const response = await api.get('/feeds')
    return response.data.feeds as Feed[]
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    async (articleId: number) => {
      await api.post(`/articles/${articleId}/read`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('articles')
        queryClient.invalidateQueries('feeds')
      }
    }
  )

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    async () => {
      await api.post('/articles/mark-read', { all: true })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('articles')
        queryClient.invalidateQueries('feeds')
      }
    }
  )

  // Toggle read/unread mutation
  const toggleReadMutation = useMutation(
    async (articleId: number) => {
      const article = articles.find((a) => a.id === articleId)
      if (article?.isRead) {
        await api.post(`/articles/${articleId}/unread`)
      } else {
        await api.post(`/articles/${articleId}/read`)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('articles')
        queryClient.invalidateQueries('feeds')
      }
    }
  )

  // Save/unsave article mutation
  const toggleSaveMutation = useMutation(
    async (articleId: number) => {
      const article = articles.find((a) => a.id === articleId)
      if (article?.isSaved) {
        await api.delete(`/articles/${articleId}/save`)
        toast.success('Removed from saved')
      } else {
        await api.post(`/articles/${articleId}/save`)
        toast.success('Saved for later')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('articles')
      }
    }
  )

  const articles = articlesResponse?.articles ?? []
  const totalUnread = feeds?.reduce((acc, feed) => acc + feed.unreadCount, 0) ?? 0

  // Group feeds by category
  const feedsByCategory = feeds?.reduce((acc, feed) => {
    const category = feed.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(feed)
    return acc
  }, {} as Record<string, Feed[]>) ?? {}

  const formatPublishedDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  // Keyboard navigation
  const { showHelp, setShowHelp, shortcuts } = useArticleNavigation({
    articles,
    selectedIndex: selectedArticleIndex,
    onSelect: setSelectedArticleIndex,
    onOpen: (articleId) => {
      markAsReadMutation.mutate(articleId)
      navigate(`/article/${articleId}`)
    },
    onToggleRead: (articleId) => toggleReadMutation.mutate(articleId),
    onSave: (articleId) => toggleSaveMutation.mutate(articleId),
    enabled: !articlesLoading && articles.length > 0
  })

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-midnight-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-64px)] sticky top-16 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          {/* Sidebar header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <Link to="/feeds" className="btn btn-primary w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Link>
          </div>

          {/* All articles */}
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                setSelectedFeed(null)
                setSelectedCategory('all')
              }}
              className={`feed-item w-full ${!selectedFeed && selectedCategory === 'all' ? 'active' : ''}`}
            >
              <Inbox className="h-5 w-5 text-ink-400 dark:text-neutral-400" />
              <span className="flex-1 text-left">All Articles</span>
              {totalUnread > 0 && (
                <span className="text-xs font-medium text-coral-700 bg-coral-100 dark:bg-coral-900/30 dark:text-coral-400 px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </button>
            <Link
              to="/saved"
              className="feed-item w-full"
            >
              <Bookmark className="h-5 w-5 text-ink-400 dark:text-neutral-400" />
              <span className="flex-1 text-left">Saved Articles</span>
            </Link>
          </div>

          {/* Feeds list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {Object.entries(feedsByCategory).map(([category, categoryFeeds]) => (
              <div key={category}>
                <h3 className="px-3 py-2 text-xs font-semibold text-ink-400 dark:text-neutral-500 uppercase tracking-wider">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {categoryFeeds.map((feed) => (
                    <button
                      key={feed.id}
                      onClick={() => setSelectedFeed(feed.id)}
                      className={`feed-item w-full ${selectedFeed === feed.id ? 'active' : ''}`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-3.5 w-3.5 text-ink-400 dark:text-neutral-400" />
                      </div>
                      <span className="flex-1 text-left truncate text-sm">
                        {feed.title || new URL(feed.url).hostname}
                      </span>
                      {feed.unreadCount > 0 && (
                        <span className="text-xs text-ink-400 dark:text-neutral-500">
                          {feed.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {(!feeds || feeds.length === 0) && (
              <div className="text-center py-8 px-4">
                <p className="text-ink-400 dark:text-neutral-500 text-sm mb-4">No feeds yet</p>
                <Link to="/feeds" className="btn btn-secondary btn-sm">
                  Add your first feed
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-16 z-10 bg-paper-50/80 dark:bg-midnight-950/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 dark:text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    className="input pl-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={`btn btn-sm ${showUnreadOnly ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <Filter className="h-4 w-4 mr-1.5" />
                    Unread
                  </button>

                  <button
                    onClick={() => refetchArticles()}
                    className="btn btn-secondary btn-sm"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>

                  {articles.length > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isLoading}
                      className="btn btn-secondary btn-sm"
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Articles list */}
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
            {articlesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card p-6">
                    <div className="skeleton h-5 w-3/4 mb-3" />
                    <div className="skeleton h-4 w-1/3 mb-4" />
                    <div className="skeleton h-4 w-full mb-2" />
                    <div className="skeleton h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Inbox className="h-8 w-8 text-ink-300 dark:text-neutral-600" />
                </div>
                <h3 className="font-display text-xl text-ink-900 dark:text-white mb-2">
                  {showUnreadOnly ? 'All caught up!' : 'No articles yet'}
                </h3>
                <p className="text-ink-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                  {showUnreadOnly
                    ? "You've read all your articles. Check back later for new content."
                    : 'Add some RSS feeds to start reading articles.'}
                </p>
                {!showUnreadOnly && (
                  <Link to="/feeds" className="btn btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Feed
                  </Link>
                )}
                {showUnreadOnly && articles.length === 0 && (
                  <button
                    onClick={() => setShowUnreadOnly(false)}
                    className="btn btn-secondary"
                  >
                    View all articles
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article, index) => (
                  <article
                    key={article.id}
                    data-article-index={index}
                    className={`article-card group animate-fade-in-up ${article.isRead ? 'read' : ''} ${selectedArticleIndex === index ? 'ring-2 ring-coral-500 ring-offset-2 dark:ring-offset-midnight-950' : ''}`}
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                    onClick={() => setSelectedArticleIndex(index)}
                  >
                    <div className="flex gap-4">
                      {/* Unread indicator */}
                      <div className="pt-2 flex-shrink-0">
                        {!article.isRead ? (
                          <div className="unread-dot" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-2 text-sm text-ink-400 dark:text-neutral-500">
                          <span className="font-medium text-ink-600 dark:text-neutral-300">
                            {article.feed.title || 'Unknown Feed'}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatPublishedDate(article.publishedAt)}
                          </span>
                          {article.isSaved && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-coral-500">
                                <Bookmark className="h-3.5 w-3.5 fill-current" />
                                Saved
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-display text-lg text-ink-900 dark:text-white mb-2 line-clamp-2 group-hover:text-coral-600 dark:group-hover:text-coral-400 transition-colors">
                          <Link
                            to={`/article/${article.id}`}
                            onClick={() => markAsReadMutation.mutate(article.id)}
                          >
                            {article.title || 'Untitled'}
                          </Link>
                        </h2>

                        {/* Summary */}
                        {article.summary && (
                          <p className="text-ink-500 dark:text-neutral-400 text-sm line-clamp-2 mb-3">
                            {article.summary.replace(/<[^>]*>/g, '').slice(0, 200)}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                          <Link
                            to={`/article/${article.id}`}
                            onClick={() => markAsReadMutation.mutate(article.id)}
                            className="text-sm font-medium text-coral-600 hover:text-coral-700 dark:text-coral-400 dark:hover:text-coral-300 flex items-center gap-1 transition-colors"
                          >
                            Read article
                            <ChevronRight className="h-4 w-4" />
                          </Link>

                          {article.url && (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-ink-400 hover:text-ink-600 dark:text-neutral-500 dark:hover:text-neutral-300 flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Original
                            </a>
                          )}

                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleSaveMutation.mutate(article.id)
                            }}
                            className={`text-sm flex items-center gap-1 transition-colors ${article.isSaved ? 'text-coral-500' : 'text-ink-400 hover:text-coral-500 dark:text-neutral-500 opacity-0 group-hover:opacity-100'}`}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${article.isSaved ? 'fill-current' : ''}`} />
                            {article.isSaved ? 'Saved' : 'Save'}
                          </button>

                          <button className="text-sm text-ink-400 hover:text-coral-600 dark:text-neutral-500 dark:hover:text-coral-400 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                            <Sparkles className="h-3.5 w-3.5" />
                            Summarize
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Keyboard shortcuts button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 btn btn-secondary shadow-lg"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-xs font-mono">?</kbd>
      </button>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  )
}
