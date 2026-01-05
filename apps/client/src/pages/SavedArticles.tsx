import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Clock,
  ExternalLink,
  ChevronRight,
  Bookmark,
  BookmarkX,
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

export default function SavedArticles() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0)
  const api = useApiClient()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch saved articles
  const { data: articlesResponse, isLoading } = useQuery('savedArticles', async () => {
    const response = await api.get('/articles/saved')
    return response.data as { articles: Article[] }
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    async (articleId: number) => {
      await api.post(`/articles/${articleId}/read`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('savedArticles')
      }
    }
  )

  // Toggle read mutation
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
        queryClient.invalidateQueries('savedArticles')
      }
    }
  )

  // Remove from saved mutation
  const removeSavedMutation = useMutation(
    async (articleId: number) => {
      await api.delete(`/articles/${articleId}/save`)
      toast.success('Removed from saved')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('savedArticles')
      }
    }
  )

  const articles = articlesResponse?.articles ?? []

  // Filter by search
  const filteredArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.feed.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles

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
    articles: filteredArticles,
    selectedIndex: selectedArticleIndex,
    onSelect: setSelectedArticleIndex,
    onOpen: (articleId) => {
      markAsReadMutation.mutate(articleId)
      navigate(`/article/${articleId}`)
    },
    onToggleRead: (articleId) => toggleReadMutation.mutate(articleId),
    onSave: (articleId) => removeSavedMutation.mutate(articleId),
    enabled: !isLoading && filteredArticles.length > 0
  })

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-900">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="font-display text-3xl text-ink-900 dark:text-paper-50">
              Saved Articles
            </h1>
          </div>
          <p className="text-ink-500 dark:text-paper-400">
            Articles you've saved for later reading
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search saved articles..."
              className="input pl-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Articles list */}
        {isLoading ? (
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
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-paper-100 dark:bg-ink-800 flex items-center justify-center">
              <Bookmark className="h-8 w-8 text-ink-300" />
            </div>
            <h3 className="font-display text-xl text-ink-900 dark:text-paper-50 mb-2">
              {searchQuery ? 'No matching articles' : 'No saved articles yet'}
            </h3>
            <p className="text-ink-500 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search term.'
                : 'Save articles from your feed to read them later.'}
            </p>
            {!searchQuery && (
              <Link to="/dashboard" className="btn btn-primary">
                Browse Articles
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article, index) => (
              <article
                key={article.id}
                data-article-index={index}
                className={`article-card group animate-slide-up ${article.isRead ? 'read' : ''} ${selectedArticleIndex === index ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-ink-900' : ''}`}
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                onClick={() => setSelectedArticleIndex(index)}
              >
                <div className="flex gap-4">
                  {/* Unread indicator */}
                  <div className="pt-2 flex-shrink-0">
                    {!article.isRead ? (
                      <div className="unread-dot" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-paper-200 dark:bg-ink-700" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex items-center gap-2 mb-2 text-sm text-ink-400">
                      <span className="font-medium text-ink-600 dark:text-paper-300">
                        {article.feed.title || 'Unknown Feed'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatPublishedDate(article.publishedAt)}
                      </span>
                      <span>·</span>
                      <span className="text-amber-500">
                        Saved {formatPublishedDate(article.savedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-display text-lg text-ink-900 dark:text-paper-50 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                      <Link
                        to={`/article/${article.id}`}
                        onClick={() => markAsReadMutation.mutate(article.id)}
                      >
                        {article.title || 'Untitled'}
                      </Link>
                    </h2>

                    {/* Summary */}
                    {article.summary && (
                      <p className="text-ink-500 dark:text-paper-400 text-sm line-clamp-2 mb-3">
                        {article.summary.replace(/<[^>]*>/g, '').slice(0, 200)}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/article/${article.id}`}
                        onClick={() => markAsReadMutation.mutate(article.id)}
                        className="text-sm font-medium text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                      >
                        Read article
                        <ChevronRight className="h-4 w-4" />
                      </Link>

                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-ink-400 hover:text-ink-600 dark:hover:text-paper-300 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Original
                        </a>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeSavedMutation.mutate(article.id)
                        }}
                        className="text-sm text-ink-400 hover:text-error-500 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <BookmarkX className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 btn btn-secondary shadow-lg"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-paper-200 dark:bg-ink-700 text-xs font-mono">?</kbd>
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
