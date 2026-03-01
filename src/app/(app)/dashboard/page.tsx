'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Clock, ExternalLink, Sparkles, Check, Rss,
  ChevronRight, Inbox, Filter, RefreshCw, Bookmark, Keyboard,
  LayoutList, LayoutGrid, AlignJustify, Tag, Pin, X, Save,
  Command, Layers
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { api } from '@/lib/api-client'
import { useArticleNavigation } from '@/hooks/use-keyboard-shortcuts'
import KeyboardShortcutsModal from '@/components/ui/keyboard-shortcuts-modal'
import { AllCaughtUpState, NoFeedsState, NoArticlesState } from '@/components/ui/empty-states'
import FeedIcon from '@/components/ui/feed-icon'
import { ArticleCardSkeleton } from '@/components/ui/skeleton'
import type { Article, Feed, Tag as TagType, SavedSearch, TopicCluster } from '@/types'

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(true)
  const [selectedFeed, setSelectedFeed] = useState<number | null>(null)
  const [selectedTag, setSelectedTag] = useState<number | null>(null)
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0)
  const [showSaveSearch, setShowSaveSearch] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')
  const [smartSort, setSmartSort] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('syncd-view-mode') as 'list' | 'grid' | 'compact') || 'list'
    }
    return 'list'
  })
  const queryClient = useQueryClient()
  const router = useRouter()

  const handleViewMode = (mode: 'list' | 'grid' | 'compact') => {
    setViewMode(mode)
    localStorage.setItem('syncd-view-mode', mode)
  }

  // ── Data Queries ──────────────────────────────────────────

  const { data: articlesResponse, isLoading: articlesLoading, refetch: refetchArticles } = useQuery({
    queryKey: ['articles', { search: searchQuery, category: selectedCategory, unread: showUnreadOnly, feedId: selectedFeed, sort: smartSort ? 'smart' : 'latest' }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (showUnreadOnly) params.set('unread', 'true')
      if (selectedFeed) params.set('feedId', String(selectedFeed))
      if (smartSort) params.set('sort', 'smart')
      params.set('limit', '50')
      return api.get(`/articles?${params}`) as Promise<{ articles: Article[]; pagination: { total: number } }>
    },
    refetchInterval: 60000,
  })

  const { data: feedsData } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => api.get('/feeds') as Promise<{ feeds: Feed[] }>,
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags') as Promise<{ tags: TagType[] }>,
  })

  const { data: savedSearchesData } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => api.get('/saved-searches') as Promise<{ searches: SavedSearch[] }>,
  })

  const { data: taggedArticles } = useQuery({
    queryKey: ['tag-articles', selectedTag],
    queryFn: () => api.get(`/tags/${selectedTag}/articles?limit=50`) as Promise<{ articles: Article[] }>,
    enabled: !!selectedTag,
  })

  const { data: clustersData } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => api.get('/clusters?limit=5') as Promise<{ clusters: TopicCluster[] }>,
    refetchInterval: 300000, // refresh every 5 min
  })

  const feeds = feedsData?.feeds
  const tags = tagsData?.tags ?? []
  const savedSearches = savedSearchesData?.searches ?? []

  // ── Mutations ─────────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: (articleId: number) => api.post(`/articles/${articleId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['feeds'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.post('/articles/mark-read', { all: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['feeds'] })
    },
  })

  const toggleReadMutation = useMutation({
    mutationFn: async (articleId: number) => {
      const article = articlesResponse?.articles?.find((a: Article) => a.id === articleId)
      if (article?.isRead) {
        await api.post(`/articles/${articleId}/unread`)
      } else {
        await api.post(`/articles/${articleId}/read`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['feeds'] })
    },
  })

  const toggleSaveMutation = useMutation({
    mutationFn: async (articleId: number) => {
      const article = articlesResponse?.articles?.find((a: Article) => a.id === articleId)
      if (article?.isSaved) {
        await api.delete(`/articles/${articleId}/save`)
        toast.success('Removed from saved')
      } else {
        await api.post(`/articles/${articleId}/save`)
        toast.success('Saved for later')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  const saveSearchMutation = useMutation({
    mutationFn: async () => {
      await api.post('/saved-searches', {
        name: saveSearchName,
        query: searchQuery,
        filters: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          feedId: selectedFeed || undefined,
          unread: showUnreadOnly || undefined,
        },
        isPinned: true,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      setShowSaveSearch(false)
      setSaveSearchName('')
      toast.success('Search saved')
    },
  })

  const deleteSavedSearchMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/saved-searches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      toast.success('Search removed')
    },
  })

  // ── Derived State ─────────────────────────────────────────

  const articles: Article[] = selectedTag ? (taggedArticles?.articles ?? []) : (articlesResponse?.articles ?? [])
  const totalUnread = feeds?.reduce((acc: number, feed: Feed) => acc + (feed.unreadCount || 0), 0) ?? 0

  const feedsByCategory: Record<string, Feed[]> = feeds?.reduce((acc: Record<string, Feed[]>, feed: Feed) => {
    const category = feed.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(feed)
    return acc
  }, {} as Record<string, Feed[]>) ?? {}

  const formatPublishedDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    try { return formatDistanceToNow(new Date(dateString), { addSuffix: true }) } catch { return 'Unknown' }
  }

  const applySavedSearch = (search: { query: string; filters?: { category?: string; feedId?: number; unread?: boolean } }) => {
    setSearchQuery(search.query)
    setSelectedCategory(search.filters?.category || 'all')
    setSelectedFeed(search.filters?.feedId || null)
    setShowUnreadOnly(search.filters?.unread ?? true)
    setSelectedTag(null)
  }

  const { showHelp, setShowHelp, shortcuts } = useArticleNavigation({
    articles,
    selectedIndex: selectedArticleIndex,
    onSelect: setSelectedArticleIndex,
    onOpen: (articleId) => {
      markAsReadMutation.mutate(articleId)
      router.push(`/article/${articleId}`)
    },
    onToggleRead: (articleId) => toggleReadMutation.mutate(articleId),
    onSave: (articleId) => toggleSaveMutation.mutate(articleId),
    enabled: !articlesLoading && articles.length > 0,
  })

  // ── Tag Pills Component ───────────────────────────────────

  const TagPills = ({ articleTags }: { articleTags?: TagType[] }) => {
    if (!articleTags || articleTags.length === 0) return null
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {articleTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-64px)] sticky top-16 border-r border-parchment-300 dark:border-ink-700 bg-white dark:bg-night-800">
          <div className="p-4 border-b border-parchment-300 dark:border-ink-700 space-y-2">
            <Link href="/feeds" className="btn btn-primary w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Link>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-400 dark:text-ink-500 bg-parchment-100 dark:bg-ink-700/50 rounded-lg hover:bg-parchment-200 dark:hover:bg-ink-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Quick search...</span>
              <kbd className="text-xs px-1.5 py-0.5 rounded bg-parchment-200 dark:bg-ink-600 font-mono flex items-center gap-0.5">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Main nav */}
            <div className="p-2 space-y-1">
              <button
                onClick={() => { setSelectedFeed(null); setSelectedCategory('all'); setSelectedTag(null) }}
                className={`feed-item w-full ${!selectedFeed && !selectedTag && selectedCategory === 'all' ? 'active' : ''}`}
              >
                <Inbox className="h-5 w-5 text-ink-400 dark:text-ink-400" />
                <span className="flex-1 text-left">All Articles</span>
                {totalUnread > 0 && (
                  <span className="text-xs font-medium text-sage-700 bg-sage-100 dark:bg-sage-900/30 dark:text-sage-400 px-2 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </button>
              <Link href="/saved" className="feed-item w-full">
                <Bookmark className="h-5 w-5 text-ink-400 dark:text-ink-400" />
                <span className="flex-1 text-left">Saved Articles</span>
              </Link>
            </div>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="p-2">
                <h3 className="px-3 py-2 text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                  Saved Searches
                </h3>
                <div className="space-y-0.5">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="group flex items-center">
                      <button
                        onClick={() => applySavedSearch(search)}
                        className="feed-item flex-1 min-w-0"
                      >
                        <Pin className="h-4 w-4 text-coral-400 flex-shrink-0" />
                        <span className="flex-1 text-left truncate text-sm">{search.name}</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const data = await api.get(`/saved-searches/${search.id}/rss-url`) as { rssUrl: string }
                            await navigator.clipboard.writeText(data.rssUrl)
                            toast.success('RSS URL copied to clipboard')
                          } catch { toast.error('Failed to get RSS URL') }
                        }}
                        className="p-1 text-ink-300 hover:text-coral-500 dark:hover:text-coral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy RSS feed URL"
                      >
                        <Rss className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSavedSearchMutation.mutate(search.id)}
                        className="p-1 text-ink-300 hover:text-ink-600 dark:hover:text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="p-2">
                <h3 className="px-3 py-2 text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                  Tags
                </h3>
                <div className="space-y-0.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => { setSelectedTag(tag.id); setSelectedFeed(null) }}
                      className={`feed-item w-full ${selectedTag === tag.id ? 'active' : ''}`}
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="flex-1 text-left truncate text-sm">{tag.name}</span>
                      {(tag.articleCount || 0) > 0 && (
                        <span className="text-xs text-ink-400 dark:text-ink-500">{tag.articleCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feeds by category */}
            <div className="p-2 space-y-4">
              {Object.entries(feedsByCategory).map(([category, categoryFeeds]) => (
                <div key={category}>
                  <h3 className="px-3 py-2 text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="space-y-0.5">
                    {categoryFeeds.map((feed) => (
                      <button
                        key={feed.id}
                        onClick={() => { setSelectedFeed(feed.id); setSelectedTag(null) }}
                        className={`feed-item w-full ${selectedFeed === feed.id ? 'active' : ''}`}
                      >
                        <FeedIcon url={feed.siteUrl || feed.url} title={feed.title} size="md" />
                        <span className="flex-1 text-left truncate text-sm">
                          {feed.title || 'Untitled'}
                        </span>
                        {(feed.unreadCount || 0) > 0 && (
                          <span className="text-xs font-medium text-sage-700 dark:text-sage-400 bg-sage-50 dark:bg-sage-900/20 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
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
                  <p className="text-ink-400 dark:text-ink-500 text-sm mb-4">No feeds yet</p>
                  <Link href="/feeds" className="btn btn-secondary btn-sm">Add your first feed</Link>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0">
          <div className="sticky top-16 z-10 bg-parchment-100/80 dark:bg-night-900/80 backdrop-blur-lg border-b border-parchment-300 dark:border-ink-700">
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search... (try intitle: author: before: is:saved)"
                    className="input pl-11 pr-20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {/* Save search button */}
                  {searchQuery && (
                    <button
                      onClick={() => setShowSaveSearch(true)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                      title="Save this search"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-parchment-200 dark:bg-ink-700 rounded-lg p-0.5">
                    {([
                      { mode: 'list' as const, icon: LayoutList, title: 'List view' },
                      { mode: 'grid' as const, icon: LayoutGrid, title: 'Grid view' },
                      { mode: 'compact' as const, icon: AlignJustify, title: 'Compact view' },
                    ]).map(({ mode, icon: Icon, title }) => (
                      <button
                        key={mode}
                        onClick={() => handleViewMode(mode)}
                        title={title}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? 'bg-white dark:bg-ink-600 shadow-sm text-sage-700 dark:text-sage-400' : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-300'}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={`btn btn-sm ${showUnreadOnly ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <Filter className="h-4 w-4 mr-1.5" />Unread
                  </button>
                  <button
                    onClick={() => setSmartSort(!smartSort)}
                    className={`btn btn-sm ${smartSort ? 'btn-primary' : 'btn-secondary'}`}
                    title="Sort by your reading interests"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />Smart
                  </button>
                  <button onClick={() => refetchArticles()} className="btn btn-secondary btn-sm" title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  {articles.length > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="btn btn-secondary btn-sm"
                    >
                      <Check className="h-4 w-4 mr-1.5" />Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Active tag filter indicator */}
              {selectedTag && (
                <div className="mt-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-ink-400" />
                  <span className="text-sm text-ink-600 dark:text-ink-300">
                    Filtering by tag: <strong>{tags.find((t) => t.id === selectedTag)?.name}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="ml-1 p-0.5 rounded text-ink-400 hover:text-ink-600 dark:hover:text-ink-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
            {/* Story Threads — topic clusters */}
            {clustersData?.clusters && clustersData.clusters.length > 0 && !selectedTag && !searchQuery && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />Story Threads
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clustersData.clusters.map((cluster: TopicCluster) => (
                    <div key={cluster.id} className="card p-4 hover:shadow-medium transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sage-500 to-sage-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className="font-medium text-sm text-ink-800 dark:text-ink-50 truncate">{cluster.label}</h4>
                      </div>
                      <p className="text-xs text-ink-400 dark:text-ink-500 mb-2">{cluster.articleCount} related articles</p>
                      <div className="space-y-1">
                        {cluster.articles.slice(0, 3).map((a) => (
                          <Link
                            key={a.id}
                            href={`/article/${a.id}`}
                            className="block text-xs text-ink-600 dark:text-ink-300 hover:text-sage-700 dark:hover:text-sage-400 truncate transition-colors"
                          >
                            <span className="text-ink-400 dark:text-ink-500 mr-1">{a.feedTitle}</span>
                            {a.title}
                          </Link>
                        ))}
                        {cluster.articleCount > 3 && (
                          <span className="text-xs text-ink-400 dark:text-ink-500">+{cluster.articleCount - 3} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {articlesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <ArticleCardSkeleton key={i} index={i} />)}
              </div>
            ) : articles.length === 0 ? (
              showUnreadOnly ? (
                <AllCaughtUpState onViewAll={() => setShowUnreadOnly(false)} />
              ) : feeds && feeds.length === 0 ? (
                <NoFeedsState />
              ) : (
                <NoArticlesState />
              )
            ) : viewMode === 'grid' ? (
              /* ── Grid View ── */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article, index) => (
                  <article
                    key={article.id}
                    data-article-index={index}
                    className={`card group p-4 animate-fade-in cursor-pointer hover:shadow-medium transition-all ${article.isRead ? 'opacity-70' : ''} ${selectedArticleIndex === index ? 'ring-2 ring-sage-600 ring-offset-2 dark:ring-offset-night-900' : ''}`}
                    style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
                    onClick={() => setSelectedArticleIndex(index)}
                  >
                    <div className="flex items-center gap-2 mb-3 text-xs text-ink-400 dark:text-ink-500">
                      {!article.isRead && <div className="unread-dot" />}
                      <span className="font-medium text-ink-600 dark:text-ink-300 truncate">{article.feed.title || 'Unknown'}</span>
                      <span className="ml-auto flex-shrink-0">{formatPublishedDate(article.publishedAt)}</span>
                    </div>
                    <h2 className="font-display text-base text-ink-800 dark:text-ink-50 mb-2 line-clamp-3 group-hover:text-sage-700 dark:group-hover:text-sage-400 transition-colors">
                      <Link href={`/article/${article.id}`} onClick={() => markAsReadMutation.mutate(article.id)}>
                        {article.title || 'Untitled'}
                      </Link>
                    </h2>
                    {article.summary && (
                      <p className="text-ink-500 dark:text-ink-400 text-xs line-clamp-3 mb-3">
                        {article.summary.replace(/<[^>]*>/g, '').slice(0, 150)}
                      </p>
                    )}
                    <TagPills articleTags={article.tags} />
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-parchment-200 dark:border-ink-700">
                      <Link href={`/article/${article.id}`} onClick={() => markAsReadMutation.mutate(article.id)} className="text-xs font-medium text-sage-700 dark:text-sage-400 flex items-center gap-0.5">
                        Read<ChevronRight className="h-3 w-3" />
                      </Link>
                      {article.isSaved && <Bookmark className="h-3 w-3 text-coral-500 fill-current ml-auto" />}
                    </div>
                  </article>
                ))}
              </div>
            ) : viewMode === 'compact' ? (
              /* ── Compact View ── */
              <div className="card divide-y divide-parchment-200 dark:divide-ink-700">
                {articles.map((article, index) => (
                  <div
                    key={article.id}
                    data-article-index={index}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-parchment-50 dark:hover:bg-ink-800 transition-colors cursor-pointer ${article.isRead ? 'opacity-60' : ''} ${selectedArticleIndex === index ? 'bg-sage-50 dark:bg-sage-900/10' : ''}`}
                    onClick={() => setSelectedArticleIndex(index)}
                  >
                    {!article.isRead ? <div className="unread-dot flex-shrink-0" /> : <div className="w-2 h-2 rounded-full bg-parchment-300 dark:bg-ink-600 flex-shrink-0" />}
                    <Link
                      href={`/article/${article.id}`}
                      onClick={() => markAsReadMutation.mutate(article.id)}
                      className="flex-1 min-w-0 text-sm text-ink-800 dark:text-ink-100 truncate hover:text-sage-700 dark:hover:text-sage-400 transition-colors"
                    >
                      {article.title || 'Untitled'}
                    </Link>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span key={tag.id} className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} title={tag.name} />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-ink-400 dark:text-ink-500 flex-shrink-0 hidden sm:block">{article.feed.title}</span>
                    <span className="text-xs text-ink-400 dark:text-ink-500 flex-shrink-0">{formatPublishedDate(article.publishedAt)}</span>
                    {article.isSaved && <Bookmark className="h-3 w-3 text-coral-500 fill-current flex-shrink-0" />}
                  </div>
                ))}
              </div>
            ) : (
              /* ── List View (default) ── */
              <div className="space-y-3">
                {articles.map((article, index) => (
                  <article
                    key={article.id}
                    data-article-index={index}
                    className={`article-card group animate-fade-in ${article.isRead ? 'read' : ''} ${selectedArticleIndex === index ? 'ring-2 ring-sage-600 ring-offset-2 dark:ring-offset-night-900' : ''}`}
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                    onClick={() => setSelectedArticleIndex(index)}
                  >
                    <div className="flex gap-4">
                      <div className="pt-2 flex-shrink-0">
                        {!article.isRead ? <div className="unread-dot" /> : <div className="w-2 h-2 rounded-full bg-parchment-300 dark:bg-ink-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 text-sm text-ink-400 dark:text-ink-500">
                          <span className="font-medium text-ink-600 dark:text-ink-300">{article.feed.title || 'Unknown Feed'}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatPublishedDate(article.publishedAt)}</span>
                          {article.isSaved && (
                            <><span>·</span><span className="flex items-center gap-1 text-coral-500"><Bookmark className="h-3.5 w-3.5 fill-current" />Saved</span></>
                          )}
                        </div>
                        <h2 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-2 line-clamp-2 group-hover:text-sage-700 dark:group-hover:text-sage-400 transition-colors">
                          <Link href={`/article/${article.id}`} onClick={() => markAsReadMutation.mutate(article.id)}>
                            {article.title || 'Untitled'}
                          </Link>
                        </h2>
                        {article.summary && (
                          <p className="text-ink-500 dark:text-ink-400 text-sm line-clamp-2 mb-3">
                            {article.summary.replace(/<[^>]*>/g, '').slice(0, 200)}
                          </p>
                        )}
                        <TagPills articleTags={article.tags} />
                        <div className="flex items-center gap-4 mt-2">
                          <Link
                            href={`/article/${article.id}`}
                            onClick={() => markAsReadMutation.mutate(article.id)}
                            className="text-sm font-medium text-sage-700 hover:text-sage-800 dark:text-sage-400 dark:hover:text-sage-300 flex items-center gap-1 transition-colors"
                          >
                            Read article<ChevronRight className="h-4 w-4" />
                          </Link>
                          {article.url && (
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300 flex items-center gap-1 transition-colors">
                              <ExternalLink className="h-3.5 w-3.5" />Original
                            </a>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaveMutation.mutate(article.id) }}
                            className={`text-sm flex items-center gap-1 transition-colors ${article.isSaved ? 'text-coral-500' : 'text-ink-400 hover:text-coral-500 dark:text-ink-500 opacity-0 group-hover:opacity-100'}`}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${article.isSaved ? 'fill-current' : ''}`} />
                            {article.isSaved ? 'Saved' : 'Save'}
                          </button>
                          <button className="text-sm text-ink-400 hover:text-sage-700 dark:text-ink-500 dark:hover:text-sage-400 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                            <Sparkles className="h-3.5 w-3.5" />Summarize
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

      {/* Save search modal */}
      {showSaveSearch && (
        <>
          <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm" onClick={() => setShowSaveSearch(false)} />
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm bg-white dark:bg-night-800 rounded-2xl border border-parchment-300 dark:border-ink-700 shadow-elevated p-6">
            <h3 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-4">Save Search</h3>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">
              Query: <code className="px-1.5 py-0.5 bg-parchment-200 dark:bg-ink-700 rounded text-xs">{searchQuery}</code>
            </p>
            <input
              type="text"
              placeholder="Give it a name..."
              className="input mb-4"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveSearchName.trim()) {
                  saveSearchMutation.mutate()
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveSearch(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={() => saveSearchMutation.mutate()}
                disabled={!saveSearchName.trim() || saveSearchMutation.isPending}
                className="btn btn-primary btn-sm"
              >
                <Pin className="h-4 w-4 mr-1" />Save & Pin
              </button>
            </div>
          </div>
        </>
      )}

      <button onClick={() => setShowHelp(true)} className="fixed bottom-6 right-6 btn btn-secondary shadow-lg" title="Keyboard shortcuts (?)">
        <Keyboard className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-parchment-300 dark:bg-ink-700 text-xs font-mono">?</kbd>
      </button>

      <KeyboardShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} shortcuts={shortcuts} />
    </div>
  )
}
