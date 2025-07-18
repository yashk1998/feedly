import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Trash2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Feed {
  id: string
  title: string
  url: string
  description: string
  lastFetchedAt: string
  isActive: boolean
  category: string
  _count: {
    articles: number
  }
}

export default function FeedManagement() {
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedCategory, setNewFeedCategory] = useState('technology')
  const [isAddingFeed, setIsAddingFeed] = useState(false)
  const queryClient = useQueryClient()

  const { data: feeds, isLoading } = useQuery('feeds', async () => {
    const response = await axios.get('/api/feeds')
    return response.data
  })

  const addFeedMutation = useMutation(
    async (feedData: { url: string; category: string }) => {
      const response = await axios.post('/api/feeds', feedData)
      return response.data
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
    async (feedId: string) => {
      await axios.delete(`/api/feeds/${feedId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feeds')
        toast.success('Feed deleted successfully!')
      },
      onError: () => {
        toast.error('Failed to delete feed')
      }
    }
  )

  const refreshFeedMutation = useMutation(
    async (feedId: string) => {
      await axios.post(`/api/feeds/${feedId}/refresh`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feeds')
        toast.success('Feed refreshed successfully!')
      },
      onError: () => {
        toast.error('Failed to refresh feed')
      }
    }
  )

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedUrl.trim()) return
    
    addFeedMutation.mutate({
      url: newFeedUrl.trim(),
      category: newFeedCategory
    })
  }

  const categories = ['technology', 'business', 'science', 'politics', 'sports', 'entertainment', 'health']

  const popularFeeds = [
    { title: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology' },
    { title: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'technology' },
    { title: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'politics' },
    { title: 'Reuters Business', url: 'https://www.reuters.com/business/feed/', category: 'business' },
    { title: 'Nature News', url: 'https://www.nature.com/nature.rss', category: 'science' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed Management</h1>
        <p className="text-gray-600">Add and manage your RSS feeds</p>
      </div>

      {/* Add New Feed */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Feed</h2>
          <button
            onClick={() => setIsAddingFeed(!isAddingFeed)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feed
          </button>
        </div>

        {isAddingFeed && (
          <form onSubmit={handleAddFeed} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSS Feed URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/feed.xml"
                className="input"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the RSS or Atom feed URL. We also support regular website URLs.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="input"
                value={newFeedCategory}
                onChange={(e) => setNewFeedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={addFeedMutation.isLoading}
                className="btn btn-primary"
              >
                {addFeedMutation.isLoading ? 'Adding...' : 'Add Feed'}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingFeed(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Popular Feeds */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Feeds</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularFeeds.map((feed, index) => (
              <button
                key={index}
                onClick={() => {
                  setNewFeedUrl(feed.url)
                  setNewFeedCategory(feed.category)
                  setIsAddingFeed(true)
                }}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="font-medium text-gray-900 text-sm">{feed.title}</div>
                <div className="text-xs text-gray-500 mt-1">{feed.category}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Existing Feeds */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Feeds</h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : feeds?.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feeds yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first RSS feed to start reading articles
            </p>
            <button
              onClick={() => setIsAddingFeed(true)}
              className="btn btn-primary"
            >
              Add Your First Feed
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feeds?.map((feed: Feed) => (
              <div key={feed.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{feed.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        feed.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {feed.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {feed.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {feed.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{feed._count.articles} articles</span>
                      <span>
                        Last updated: {new Date(feed.lastFetchedAt).toLocaleDateString()}
                      </span>
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Source
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => refreshFeedMutation.mutate(feed.id)}
                      disabled={refreshFeedMutation.isLoading}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Refresh feed"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshFeedMutation.isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this feed?')) {
                          deleteFeedMutation.mutate(feed.id)
                        }
                      }}
                      disabled={deleteFeedMutation.isLoading}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete feed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 