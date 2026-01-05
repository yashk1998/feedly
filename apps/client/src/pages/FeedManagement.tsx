import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Rss,
  X,
  Check,
  Globe,
  Clock,
  Sparkles,
  Upload,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useApiClient } from '../lib/apiClient'

interface Feed {
  id: number
  subscriptionId: number
  title?: string | null
  url: string
  siteUrl?: string | null
  lastFetchedAt: string | null
  isActive: boolean
  category: string
  unreadCount: number
  totalArticles: number
}

export default function FeedManagement() {
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedCategory, setNewFeedCategory] = useState('technology')
  const [isAddingFeed, setIsAddingFeed] = useState(false)
  const [showOPMLImport, setShowOPMLImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const api = useApiClient()

  const { data: feeds, isLoading } = useQuery('feeds', async () => {
    const response = await api.get('/feeds')
    return response.data.feeds as Feed[]
  })

  const addFeedMutation = useMutation(
    async (feedData: { url: string; category: string }) => {
      const response = await api.post('/feeds', feedData)
      return response.data.feed as Feed
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feeds')
        setNewFeedUrl('')
        setNewFeedCategory('technology')
        setIsAddingFeed(false)
        toast.success('Feed added successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to add feed')
      }
    }
  )

  const deleteFeedMutation = useMutation(
    async (subscriptionId: number) => {
      await api.delete(`/feeds/${subscriptionId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feeds')
        toast.success('Feed removed')
      },
      onError: () => {
        toast.error('Failed to delete feed')
      }
    }
  )

  const refreshFeedMutation = useMutation(
    async (feedId: number) => {
      await api.post(`/feeds/${feedId}/refresh`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feeds')
        toast.success('Feed refreshed!')
      },
      onError: () => {
        toast.error('Failed to refresh feed')
      }
    }
  )

  // OPML import mutation
  const importOPMLMutation = useMutation(
    async (opmlContent: string) => {
      const response = await api.post('/feeds/import-opml', { opmlContent })
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('feeds')
        setShowOPMLImport(false)
        toast.success(data.message)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to import OPML')
      }
    }
  )

  const handleOPMLFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.opml') && !file.name.endsWith('.xml')) {
      toast.error('Please select an OPML or XML file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        importOPMLMutation.mutate(content)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedUrl.trim()) return

    addFeedMutation.mutate({
      url: newFeedUrl.trim(),
      category: newFeedCategory
    })
  }

  const categories = [
    'technology',
    'business',
    'science',
    'politics',
    'sports',
    'entertainment',
    'health',
    'design',
    'news'
  ]

  const popularFeeds = [
    // Technology
    { title: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology', icon: '🚀' },
    { title: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'technology', icon: '💻' },
    { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technology', icon: '⚡' },
    { title: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'technology', icon: '🔌' },
    { title: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'technology', icon: '🔧' },
    { title: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'technology', icon: '🎓' },
    { title: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'technology', icon: '📱' },

    // News
    { title: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'news', icon: '📰' },
    { title: 'Reuters - Top News', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', category: 'news', icon: '🌐' },
    { title: 'AP News', url: 'https://apnews.com/apf-topnews', category: 'news', icon: '📡' },
    { title: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'news', icon: '🎙️' },
    { title: 'The Guardian - World', url: 'https://www.theguardian.com/world/rss', category: 'news', icon: '🇬🇧' },
    { title: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'news', icon: '🌍' },
    { title: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/cnn_topstories.rss', category: 'news', icon: '📺' },

    // Business (RSS-friendly sources only)
    { title: 'Harvard Business Review', url: 'https://hbr.org/resources/rss', category: 'business', icon: '🎯' },
    { title: 'Inc.', url: 'https://www.inc.com/rss', category: 'business', icon: '📈' },
    { title: 'Entrepreneur', url: 'https://www.entrepreneur.com/latest.rss', category: 'business', icon: '💼' },
    { title: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss', category: 'business', icon: '⚡' },

    // Science
    { title: 'Nature', url: 'https://www.nature.com/nature.rss', category: 'science', icon: '🔬' },
    { title: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science', icon: '🧪' },
    { title: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'science', icon: '🚀' },
    { title: 'Scientific American', url: 'https://rss.sciam.com/ScientificAmerican-Global', category: 'science', icon: '🔭' },
    { title: 'New Scientist', url: 'https://www.newscientist.com/feed/home/', category: 'science', icon: '⚗️' },

    // Design
    { title: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'design', icon: '🎨' },
    { title: 'A List Apart', url: 'https://alistapart.com/main/feed/', category: 'design', icon: '✏️' },
    { title: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'design', icon: '💅' },
    { title: 'Dribbble', url: 'https://dribbble.com/shots/popular.rss', category: 'design', icon: '🏀' },

    // Entertainment
    { title: 'Variety', url: 'https://variety.com/feed/', category: 'entertainment', icon: '🎬' },
    { title: 'Rolling Stone', url: 'https://www.rollingstone.com/feed/', category: 'entertainment', icon: '🎸' },
    { title: 'IGN', url: 'https://feeds.feedburner.com/ign/all', category: 'entertainment', icon: '🎮' },

    // Health
    { title: 'WebMD Health', url: 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', category: 'health', icon: '🏥' },
    { title: 'Medical News Today', url: 'https://www.medicalnewstoday.com/rss', category: 'health', icon: '💊' },

    // Sports
    { title: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'sports', icon: '⚽' },
    { title: 'Bleacher Report', url: 'https://bleacherreport.com/articles/feed', category: 'sports', icon: '🏆' },
  ]

  // Group feeds by category
  const feedsByCategory = feeds?.reduce((acc, feed) => {
    const category = feed.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(feed)
    return acc
  }, {} as Record<string, Feed[]>) ?? {}

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-900">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 dark:text-paper-50 mb-2">
            Manage Feeds
          </h1>
          <p className="text-ink-500 dark:text-paper-400">
            Add and organize your RSS subscriptions
          </p>
        </div>

        {/* Add Feed Section */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl text-ink-900 dark:text-paper-50 mb-1">
                Add New Feed
              </h2>
              <p className="text-sm text-ink-500 dark:text-paper-400">
                Enter an RSS URL or website address
              </p>
            </div>
            {!isAddingFeed && (
              <button
                onClick={() => setIsAddingFeed(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feed
              </button>
            )}
          </div>

          {isAddingFeed && (
            <form onSubmit={handleAddFeed} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-300 mb-2">
                  Feed URL
                </label>
                <div className="relative">
                  <Globe className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="url"
                    placeholder="https://example.com/feed.xml"
                    className="input pl-11"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-ink-400 dark:text-paper-500 mt-1.5">
                  We'll automatically discover the RSS feed from any URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-300 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setNewFeedCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        newFeedCategory === category
                          ? 'bg-amber-500 text-white'
                          : 'bg-paper-100 dark:bg-ink-800 text-ink-600 dark:text-paper-400 hover:bg-paper-200 dark:hover:bg-ink-700'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addFeedMutation.isLoading}
                  className="btn btn-primary"
                >
                  {addFeedMutation.isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Add Feed
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFeed(false)
                    setNewFeedUrl('')
                  }}
                  className="btn btn-ghost"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Popular Feeds */}
          {!isAddingFeed && (
            <div>
              <h3 className="text-sm font-medium text-ink-700 dark:text-paper-300 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Popular Feeds
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {popularFeeds.map((feed, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setNewFeedUrl(feed.url)
                      setNewFeedCategory(feed.category)
                      setIsAddingFeed(true)
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-paper-200 dark:border-ink-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group text-left"
                  >
                    <span className="text-xl">{feed.icon}</span>
                    <div>
                      <div className="font-medium text-ink-900 dark:text-paper-100 text-sm group-hover:text-amber-600">
                        {feed.title}
                      </div>
                      <div className="text-xs text-ink-400 dark:text-paper-500">
                        {feed.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OPML Import Section */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-ink-900 dark:text-paper-50 mb-1">
                Import from OPML
              </h2>
              <p className="text-sm text-ink-500 dark:text-paper-400">
                Import feeds from another RSS reader
              </p>
            </div>
            <button
              onClick={() => setShowOPMLImport(!showOPMLImport)}
              className="btn btn-secondary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import OPML
            </button>
          </div>

          {showOPMLImport && (
            <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-paper-300 dark:border-ink-600 bg-paper-50 dark:bg-ink-800/50">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-medium text-ink-900 dark:text-paper-50 mb-2">
                  Upload OPML File
                </h3>
                <p className="text-sm text-ink-500 dark:text-paper-400 mb-4 max-w-sm mx-auto">
                  Export your subscriptions from Feedly, Inoreader, or any RSS reader as OPML and upload here.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".opml,.xml"
                  onChange={handleOPMLFileSelect}
                  className="hidden"
                  id="opml-file-input"
                />
                <label
                  htmlFor="opml-file-input"
                  className={`btn btn-primary cursor-pointer ${importOPMLMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {importOPMLMutation.isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </label>
                <button
                  onClick={() => setShowOPMLImport(false)}
                  className="btn btn-ghost ml-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Your Feeds */}
        <div className="card p-6">
          <h2 className="font-display text-xl text-ink-900 dark:text-paper-50 mb-6">
            Your Feeds
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-paper-200 dark:border-ink-700">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-1/3 mb-2" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !feeds || feeds.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-paper-100 dark:bg-ink-800 flex items-center justify-center">
                <Rss className="h-8 w-8 text-ink-300 dark:text-ink-600" />
              </div>
              <h3 className="font-display text-lg text-ink-900 dark:text-paper-50 mb-2">
                No feeds yet
              </h3>
              <p className="text-ink-500 dark:text-paper-400 mb-6 max-w-sm mx-auto">
                Add your first RSS feed to start curating your personalized reading list.
              </p>
              <button
                onClick={() => setIsAddingFeed(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Feed
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(feedsByCategory).map(([category, categoryFeeds]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-ink-400 dark:text-paper-500 uppercase tracking-wider mb-3">
                    {category} ({categoryFeeds.length})
                  </h3>
                  <div className="space-y-2">
                    {categoryFeeds.map((feed) => (
                      <div
                        key={feed.subscriptionId}
                        className="flex items-center gap-4 p-4 rounded-xl border border-paper-200 dark:border-ink-700 hover:border-paper-300 dark:hover:border-ink-600 transition-colors group"
                      >
                        {/* Feed icon */}
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <Rss className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>

                        {/* Feed info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-ink-900 dark:text-paper-50 truncate">
                              {feed.title || new URL(feed.url).hostname}
                            </h4>
                            <span className={`badge ${feed.isActive ? 'badge-success' : 'badge-warning'}`}>
                              {feed.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-ink-400 dark:text-paper-500">
                            <span>{feed.totalArticles} articles</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {feed.lastFetchedAt
                                ? `Updated ${new Date(feed.lastFetchedAt).toLocaleDateString()}`
                                : 'Never updated'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {feed.siteUrl && (
                            <a
                              href={feed.siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-icon-sm"
                              title="Visit site"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => refreshFeedMutation.mutate(feed.id)}
                            disabled={refreshFeedMutation.isLoading}
                            className="btn btn-ghost btn-icon-sm"
                            title="Refresh feed"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshFeedMutation.isLoading ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Remove this feed from your subscriptions?')) {
                                deleteFeedMutation.mutate(feed.subscriptionId)
                              }
                            }}
                            disabled={deleteFeedMutation.isLoading}
                            className="btn btn-ghost btn-icon-sm text-error-500 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20"
                            title="Remove feed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
