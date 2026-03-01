'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, RefreshCw, ExternalLink, Rss, X, Check, Globe, Clock, Sparkles, Upload, FileText, Download, Search, CheckCircle, Users, ChevronLeft, ChevronRight, Compass, Zap, VolumeX, Bell, Tag, Webhook, Languages } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api-client'
import type { Feed, FeedAction } from '@/types'

const categories = ['technology', 'business', 'science', 'politics', 'sports', 'entertainment', 'health', 'design', 'news']

const popularFeeds = [
  { title: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology', icon: '🚀' },
  { title: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'technology', icon: '💻' },
  { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technology', icon: '⚡' },
  { title: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'technology', icon: '🔌' },
  { title: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'technology', icon: '🔧' },
  { title: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'technology', icon: '🎓' },
  { title: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'news', icon: '📰' },
  { title: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'news', icon: '🎙️' },
  { title: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'news', icon: '🇬🇧' },
  { title: 'Nature', url: 'https://www.nature.com/nature.rss', category: 'science', icon: '🔬' },
  { title: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science', icon: '🧪' },
  { title: 'Harvard Business Review', url: 'https://hbr.org/resources/rss', category: 'business', icon: '🎯' },
  { title: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'design', icon: '🎨' },
  { title: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'design', icon: '💅' },
  { title: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'sports', icon: '⚽' },
]

interface DiscoveryFeed {
  id: number
  url: string
  title: string
  description: string | null
  category: string
  language: string
  subscribers: number
  avgPostsPerWeek: number
  isVerified: boolean
  isSubscribed: boolean
}

interface DiscoveryCategory {
  name: string
  count: number
}

type Tab = 'manage' | 'discover'

export default function FeedManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('manage')
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedCategory, setNewFeedCategory] = useState('technology')
  const [isAddingFeed, setIsAddingFeed] = useState(false)
  const [showOPMLImport, setShowOPMLImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Feed Actions state
  const [expandedFeedId, setExpandedFeedId] = useState<number | null>(null)

  // Discovery state
  const [discoverQuery, setDiscoverQuery] = useState('')
  const [discoverCategory, setDiscoverCategory] = useState('')
  const [discoverPage, setDiscoverPage] = useState(1)

  const { data: feedsData, isLoading } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => api.get('/feeds') as Promise<{ feeds: Feed[] }>,
  })

  const feeds = feedsData?.feeds

  const { data: discoveryData, isLoading: discoveryLoading } = useQuery({
    queryKey: ['discover-feeds', discoverQuery, discoverCategory, discoverPage],
    queryFn: () => {
      const params = new URLSearchParams()
      if (discoverQuery) params.set('q', discoverQuery)
      if (discoverCategory) params.set('category', discoverCategory)
      params.set('page', String(discoverPage))
      return api.get(`/feeds/discover?${params}`) as Promise<{
        feeds: DiscoveryFeed[]
        total: number
        page: number
        totalPages: number
        categories: DiscoveryCategory[]
      }>
    },
    enabled: activeTab === 'discover',
  })

  const addFeedMutation = useMutation({
    mutationFn: (feedData: { url: string; category: string }) => api.post('/feeds', feedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] })
      queryClient.invalidateQueries({ queryKey: ['discover-feeds'] })
      setNewFeedUrl(''); setNewFeedCategory('technology'); setIsAddingFeed(false)
      toast.success('Feed added successfully!')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to add feed'),
  })

  const deleteFeedMutation = useMutation({
    mutationFn: (subscriptionId: number) => api.delete(`/feeds/${subscriptionId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['feeds'] }); toast.success('Feed removed') },
    onError: () => toast.error('Failed to delete feed'),
  })

  const refreshFeedMutation = useMutation({
    mutationFn: (feedId: number) => api.post(`/feeds/${feedId}/refresh`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['feeds'] }); toast.success('Feed refreshed!') },
    onError: () => toast.error('Failed to refresh feed'),
  })

  const importOPMLMutation = useMutation({
    mutationFn: (opmlContent: string) => api.post('/feeds/import-opml', { opmlContent }) as Promise<any>,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] }); setShowOPMLImport(false)
      toast.success(data.message)
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to import OPML'),
  })

  // Feed actions
  const { data: actionsData } = useQuery({
    queryKey: ['feed-actions', expandedFeedId],
    queryFn: () => api.get(`/actions/feed/${expandedFeedId}`) as Promise<{ actions: FeedAction[] }>,
    enabled: !!expandedFeedId,
  })

  const toggleActionMutation = useMutation({
    mutationFn: ({ feedId, type, isEnabled, config }: { feedId: number; type: string; isEnabled: boolean; config?: Record<string, any> }) =>
      api.post('/actions', { feedId, type, isEnabled, config: config || {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-actions', expandedFeedId] })
      toast.success('Action updated')
    },
    onError: () => toast.error('Failed to update action'),
  })

  const deleteActionMutation = useMutation({
    mutationFn: (actionId: number) => api.delete(`/actions/${actionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-actions', expandedFeedId] })
      toast.success('Action removed')
    },
    onError: () => toast.error('Failed to remove action'),
  })

  const subscribeFromDiscovery = (feed: DiscoveryFeed) => {
    addFeedMutation.mutate({ url: feed.url, category: feed.category })
  }

  const handleOPMLFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.opml') && !file.name.endsWith('.xml')) { toast.error('Please select an OPML or XML file'); return }
    const reader = new FileReader()
    reader.onload = (event) => { const content = event.target?.result as string; if (content) importOPMLMutation.mutate(content) }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedUrl.trim()) return
    addFeedMutation.mutate({ url: newFeedUrl.trim(), category: newFeedCategory })
  }

  const feedsByCategory: Record<string, Feed[]> = feeds?.reduce((acc: Record<string, Feed[]>, feed: Feed) => {
    const category = feed.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(feed)
    return acc
  }, {} as Record<string, Feed[]>) ?? {}

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-800 dark:text-ink-50 mb-2">Feeds</h1>
          <p className="text-ink-500 dark:text-ink-400">Manage subscriptions and discover new sources</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-parchment-200 dark:bg-ink-700 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manage' ? 'bg-white dark:bg-night-800 text-ink-800 dark:text-ink-50 shadow-sm' : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'}`}
          >
            <Rss className="h-4 w-4 inline mr-2" />My Feeds
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'discover' ? 'bg-white dark:bg-night-800 text-ink-800 dark:text-ink-50 shadow-sm' : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'}`}
          >
            <Compass className="h-4 w-4 inline mr-2" />Discover
          </button>
        </div>

        {activeTab === 'manage' && (
          <>
            {/* Add Feed */}
            <div className="card p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-1">Add New Feed</h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">Enter an RSS URL or website address</p>
                </div>
                {!isAddingFeed && <button onClick={() => setIsAddingFeed(true)} className="btn btn-primary"><Plus className="h-4 w-4 mr-2" />Add Feed</button>}
              </div>

              {isAddingFeed && (
                <form onSubmit={handleAddFeed} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Feed URL</label>
                    <div className="relative">
                      <Globe className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input type="url" placeholder="https://example.com/feed.xml" className="input pl-11" value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} required autoFocus />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button key={cat} type="button" onClick={() => setNewFeedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${newFeedCategory === cat ? 'bg-sage-600 text-white' : 'bg-parchment-200 dark:bg-ink-700 text-ink-600 dark:text-ink-400 hover:bg-parchment-300 dark:hover:bg-ink-600'}`}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={addFeedMutation.isPending} className="btn btn-primary">
                      {addFeedMutation.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Adding...</> : <><Check className="h-4 w-4 mr-2" />Add Feed</>}
                    </button>
                    <button type="button" onClick={() => { setIsAddingFeed(false); setNewFeedUrl('') }} className="btn btn-ghost"><X className="h-4 w-4 mr-2" />Cancel</button>
                  </div>
                </form>
              )}

              {!isAddingFeed && (
                <div>
                  <h3 className="text-sm font-medium text-ink-600 dark:text-ink-300 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sage-600" />Popular Feeds
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {popularFeeds.map((feed, index) => (
                      <button key={index} onClick={() => { setNewFeedUrl(feed.url); setNewFeedCategory(feed.category); setIsAddingFeed(true) }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-parchment-300 dark:border-ink-600 hover:border-sage-300 dark:hover:border-sage-700 hover:bg-sage-50 dark:hover:bg-sage-900/10 transition-all group text-left">
                        <span className="text-xl">{feed.icon}</span>
                        <div>
                          <div className="font-medium text-ink-800 dark:text-ink-100 text-sm group-hover:text-sage-700 dark:group-hover:text-sage-400">{feed.title}</div>
                          <div className="text-xs text-ink-400 dark:text-ink-500">{feed.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* OPML Import / Export */}
            <div className="card p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-1">Import & Export</h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">Import or export feeds as OPML for portability</p>
                </div>
                <div className="flex gap-2">
                  <a href="/api/feeds/export-opml" download className="btn btn-secondary"><Download className="h-4 w-4 mr-2" />Export OPML</a>
                  <button onClick={() => setShowOPMLImport(!showOPMLImport)} className="btn btn-secondary"><Upload className="h-4 w-4 mr-2" />Import OPML</button>
                </div>
              </div>
              {showOPMLImport && (
                <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-parchment-300 dark:border-ink-600 bg-parchment-50 dark:bg-ink-700/50">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-sage-700 dark:text-sage-400" />
                    </div>
                    <h3 className="font-medium text-ink-800 dark:text-ink-50 mb-2">Upload OPML File</h3>
                    <p className="text-sm text-ink-500 dark:text-ink-400 mb-4 max-w-sm mx-auto">Export your subscriptions from Feedly, Inoreader, or any RSS reader as OPML and upload here.</p>
                    <input ref={fileInputRef} type="file" accept=".opml,.xml" onChange={handleOPMLFileSelect} className="hidden" id="opml-file-input" />
                    <label htmlFor="opml-file-input" className={`btn btn-primary cursor-pointer ${importOPMLMutation.isPending ? 'opacity-50' : ''}`}>
                      {importOPMLMutation.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Importing...</> : <><Upload className="h-4 w-4 mr-2" />Choose File</>}
                    </label>
                    <button onClick={() => setShowOPMLImport(false)} className="btn btn-ghost ml-2">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Feed List */}
            <div className="card p-6">
              <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-6">Your Feeds</h2>
              {isLoading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border border-parchment-300 dark:border-ink-700">
                    <div className="skeleton w-10 h-10 rounded-lg" />
                    <div className="flex-1"><div className="skeleton h-4 w-1/3 mb-2" /><div className="skeleton h-3 w-2/3" /></div>
                  </div>
                ))}</div>
              ) : !feeds || feeds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
                    <Rss className="h-8 w-8 text-ink-300 dark:text-ink-600" />
                  </div>
                  <h3 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-2">No feeds yet</h3>
                  <p className="text-ink-500 dark:text-ink-400 mb-6 max-w-sm mx-auto">Add your first RSS feed to start curating your personalized reading list.</p>
                  <button onClick={() => setIsAddingFeed(true)} className="btn btn-primary"><Plus className="h-4 w-4 mr-2" />Add Your First Feed</button>
                </div>
              ) : (
                <div className="space-y-8">
                  {(Object.entries(feedsByCategory) as [string, Feed[]][]).map(([category, categoryFeeds]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mb-3">{category} ({categoryFeeds.length})</h3>
                      <div className="space-y-2">
                        {categoryFeeds.map((feed: Feed) => (
                          <div key={feed.id} className="rounded-xl border border-parchment-300 dark:border-ink-700 hover:border-sage-300 dark:hover:border-ink-600 transition-colors group">
                            <div className="flex items-center gap-4 p-4">
                              <div className="w-10 h-10 rounded-lg bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                                <Rss className="h-5 w-5 text-sage-700 dark:text-sage-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-ink-800 dark:text-ink-50 truncate">{feed.title || 'Untitled'}</h4>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-ink-400 dark:text-ink-500">
                                  <span>{feed.totalArticles || 0} articles</span>
                                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{feed.lastFetchedAt ? `Updated ${new Date(feed.lastFetchedAt).toLocaleDateString()}` : 'Never updated'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setExpandedFeedId(expandedFeedId === feed.id ? null : feed.id)} className={`btn btn-ghost btn-sm ${expandedFeedId === feed.id ? 'text-sage-600' : ''}`} title="Feed actions">
                                  <Zap className="h-4 w-4" />
                                </button>
                                {feed.siteUrl && <a href={feed.siteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Visit site"><ExternalLink className="h-4 w-4" /></a>}
                                <button onClick={() => refreshFeedMutation.mutate(feed.id)} disabled={refreshFeedMutation.isPending} className="btn btn-ghost btn-sm" title="Refresh feed">
                                  <RefreshCw className={`h-4 w-4 ${refreshFeedMutation.isPending ? 'animate-spin' : ''}`} />
                                </button>
                                <button onClick={() => { if (confirm('Remove this feed?')) deleteFeedMutation.mutate(feed.id) }} className="btn btn-ghost btn-sm text-error-500 hover:text-error-600" title="Remove feed">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Feed Actions Panel */}
                            {expandedFeedId === feed.id && (
                              <FeedActionsPanel
                                feedId={feed.id}
                                actions={actionsData?.actions || []}
                                onToggle={(type, isEnabled, config) => toggleActionMutation.mutate({ feedId: feed.id, type, isEnabled, config })}
                                onDelete={(actionId) => deleteActionMutation.mutate(actionId)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'discover' && (
          <>
            {/* Search */}
            <div className="card p-6 mb-6">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search feeds by name, topic, or URL..."
                  className="input pl-11"
                  value={discoverQuery}
                  onChange={(e) => { setDiscoverQuery(e.target.value); setDiscoverPage(1) }}
                />
              </div>

              {/* Category filters */}
              {discoveryData?.categories && discoveryData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => { setDiscoverCategory(''); setDiscoverPage(1) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!discoverCategory ? 'bg-sage-600 text-white' : 'bg-parchment-200 dark:bg-ink-700 text-ink-600 dark:text-ink-400 hover:bg-parchment-300 dark:hover:bg-ink-600'}`}
                  >
                    All
                  </button>
                  {discoveryData.categories.map((cat: DiscoveryCategory) => (
                    <button
                      key={cat.name}
                      onClick={() => { setDiscoverCategory(cat.name); setDiscoverPage(1) }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${discoverCategory === cat.name ? 'bg-sage-600 text-white' : 'bg-parchment-200 dark:bg-ink-700 text-ink-600 dark:text-ink-400 hover:bg-parchment-300 dark:hover:bg-ink-600'}`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Discovery Results */}
            <div className="card p-6">
              {discoveryLoading ? (
                <div className="space-y-4">{[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border border-parchment-300 dark:border-ink-700">
                    <div className="skeleton w-10 h-10 rounded-lg" />
                    <div className="flex-1"><div className="skeleton h-4 w-1/3 mb-2" /><div className="skeleton h-3 w-2/3" /></div>
                  </div>
                ))}</div>
              ) : !discoveryData?.feeds || discoveryData.feeds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
                    <Compass className="h-8 w-8 text-ink-300 dark:text-ink-600" />
                  </div>
                  <h3 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-2">No feeds found</h3>
                  <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
                    {discoverQuery ? 'Try a different search term or browse by category.' : 'The feed directory is empty. Add feeds manually using the My Feeds tab.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl text-ink-800 dark:text-ink-50">
                      {discoverQuery ? `Results for "${discoverQuery}"` : discoverCategory || 'All Feeds'}
                    </h2>
                    <span className="text-sm text-ink-400">{discoveryData.total} feeds</span>
                  </div>
                  <div className="space-y-3">
                    {discoveryData.feeds.map((feed: DiscoveryFeed) => (
                      <div key={feed.id} className="flex items-center gap-4 p-4 rounded-xl border border-parchment-300 dark:border-ink-700 hover:border-sage-300 dark:hover:border-ink-600 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                          <Rss className="h-5 w-5 text-sage-700 dark:text-sage-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-ink-800 dark:text-ink-50 truncate">{feed.title}</h4>
                            {feed.isVerified && (
                              <CheckCircle className="h-4 w-4 text-sage-600 flex-shrink-0" />
                            )}
                          </div>
                          {feed.description && (
                            <p className="text-sm text-ink-500 dark:text-ink-400 line-clamp-1 mb-1">{feed.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-ink-400 dark:text-ink-500">
                            <span className="px-2 py-0.5 rounded bg-parchment-200 dark:bg-ink-700">{feed.category}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{feed.subscribers} subscribers</span>
                            <span>{feed.avgPostsPerWeek.toFixed(1)} posts/week</span>
                          </div>
                        </div>
                        <button
                          onClick={() => subscribeFromDiscovery(feed)}
                          disabled={feed.isSubscribed || addFeedMutation.isPending}
                          className={`btn btn-sm flex-shrink-0 ${feed.isSubscribed ? 'btn-ghost text-sage-600' : 'btn-primary'}`}
                        >
                          {feed.isSubscribed ? (
                            <><Check className="h-4 w-4 mr-1" />Subscribed</>
                          ) : (
                            <><Plus className="h-4 w-4 mr-1" />Subscribe</>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {discoveryData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-parchment-300 dark:border-ink-700">
                      <button
                        onClick={() => setDiscoverPage((p) => Math.max(1, p - 1))}
                        disabled={discoverPage <= 1}
                        className="btn btn-ghost btn-sm"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />Previous
                      </button>
                      <span className="text-sm text-ink-500">
                        Page {discoveryData.page} of {discoveryData.totalPages}
                      </span>
                      <button
                        onClick={() => setDiscoverPage((p) => Math.min(discoveryData.totalPages, p + 1))}
                        disabled={discoverPage >= discoveryData.totalPages}
                        className="btn btn-ghost btn-sm"
                      >
                        Next<ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const ACTION_TYPES = [
  { type: 'silence' as const, label: 'Silence', description: 'Auto-mark new articles as read', icon: VolumeX },
  { type: 'notify' as const, label: 'Notify', description: 'Alert on keyword matches via webhook', icon: Bell },
  { type: 'tag' as const, label: 'Auto-Tag', description: 'Automatically tag new articles', icon: Tag },
  { type: 'webhook' as const, label: 'Webhook', description: 'Forward articles to an external URL', icon: Webhook },
  { type: 'translate' as const, label: 'Translate', description: 'Auto-translate articles on open', icon: Languages },
]

function FeedActionsPanel({
  actions,
  onToggle,
}: {
  feedId: number
  actions: FeedAction[]
  onToggle: (type: string, isEnabled: boolean, config?: Record<string, any>) => void
  onDelete: (actionId: number) => void
}) {
  const [editingType, setEditingType] = useState<string | null>(null)
  const [keywords, setKeywords] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [targetLang, setTargetLang] = useState('es')

  const activeActions = new Map(actions.map((a) => [a.type, a]))

  const handleEnable = (type: string) => {
    const existing = activeActions.get(type)
    if (existing) {
      // Toggle existing action
      onToggle(type, !existing.isEnabled, existing.config)
    } else if (type === 'silence' || type === 'translate') {
      // No config needed
      onToggle(type, true, type === 'translate' ? { targetLang } : {})
    } else {
      // Need config — open editor
      setEditingType(type)
    }
  }

  const handleSaveConfig = (type: string) => {
    const config: Record<string, any> = {}
    if (type === 'notify') {
      config.keywords = keywords.split(',').map((k) => k.trim()).filter(Boolean)
      config.webhookUrl = webhookUrl || undefined
    } else if (type === 'tag') {
      config.keywords = keywords.split(',').map((k) => k.trim()).filter(Boolean)
    } else if (type === 'webhook') {
      config.webhookUrl = webhookUrl
    } else if (type === 'translate') {
      config.targetLang = targetLang
    }
    onToggle(type, true, config)
    setEditingType(null)
    setKeywords('')
    setWebhookUrl('')
  }

  return (
    <div className="border-t border-parchment-300 dark:border-ink-700 p-4 bg-parchment-50 dark:bg-ink-800/50 rounded-b-xl">
      <h4 className="text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5" />Feed Actions
      </h4>
      <div className="space-y-2">
        {ACTION_TYPES.map(({ type, label, description, icon: Icon }) => {
          const action = activeActions.get(type)
          const isActive = action?.isEnabled ?? false

          return (
            <div key={type}>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-sage-600' : 'text-ink-400 dark:text-ink-500'}`} />
                  <div>
                    <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}</span>
                    <p className="text-xs text-ink-400 dark:text-ink-500">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {action && (type === 'notify' || type === 'tag' || type === 'webhook' || type === 'translate') && (
                    <button
                      onClick={() => {
                        if (action.config) {
                          setKeywords((action.config.keywords || []).join(', '))
                          setWebhookUrl(action.config.webhookUrl || '')
                          setTargetLang(action.config.targetLang || 'es')
                        }
                        setEditingType(editingType === type ? null : type)
                      }}
                      className="text-xs text-sage-600 hover:text-sage-700 dark:text-sage-400"
                    >
                      Configure
                    </button>
                  )}
                  <button
                    onClick={() => handleEnable(type)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isActive ? 'bg-sage-600' : 'bg-parchment-300 dark:bg-ink-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Config editor */}
              {editingType === type && (
                <div className="ml-7 mb-2 p-3 rounded-lg bg-parchment-100 dark:bg-ink-700 space-y-3">
                  {(type === 'notify' || type === 'tag') && (
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1">Keywords (comma-separated)</label>
                      <input
                        type="text"
                        className="input text-sm"
                        placeholder="e.g. AI, machine learning, GPT"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                      />
                    </div>
                  )}
                  {(type === 'notify' || type === 'webhook') && (
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1">Webhook URL</label>
                      <input
                        type="url"
                        className="input text-sm"
                        placeholder="https://hooks.slack.com/..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                    </div>
                  )}
                  {type === 'translate' && (
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1">Target Language</label>
                      <select className="input text-sm" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="hi">Hindi</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="pt">Portuguese</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveConfig(type)} className="btn btn-primary btn-sm">
                      <Check className="h-3.5 w-3.5 mr-1" />Save
                    </button>
                    <button onClick={() => setEditingType(null)} className="btn btn-ghost btn-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
