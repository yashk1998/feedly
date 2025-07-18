import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Plus, Filter, Search, Clock, ExternalLink, Sparkles } from 'lucide-react'
import axios from 'axios'

interface Article {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
  readAt: string | null
  feed: {
    title: string
    url: string
  }
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const { data: articles, isLoading } = useQuery(
    ['articles', { search: searchQuery, category: selectedCategory, unread: showUnreadOnly }],
    async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (showUnreadOnly) params.append('unread', 'true')
      
      const response = await axios.get(`/api/articles?${params}`)
      return response.data
    },
    { refetchInterval: 60000 } // Refetch every minute
  )

  const { data: feeds } = useQuery('feeds', async () => {
    const response = await axios.get('/api/feeds')
    return response.data
  })

  const markAsRead = async (articleId: string) => {
    try {
      await axios.post(`/api/articles/${articleId}/read`)
      // Invalidate queries to refetch data
    } catch (error) {
      console.error('Failed to mark article as read:', error)
    }
  }

  const categories = ['all', 'technology', 'business', 'science', 'politics', 'sports']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/feeds" className="btn btn-primary w-full flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Feed
              </Link>
              <button className="btn btn-outline w-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Summary
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="input pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Unread Only */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="unread-only"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
              <label htmlFor="unread-only" className="ml-2 text-sm text-gray-700">
                Show unread only
              </label>
            </div>
          </div>

          {/* Your Feeds */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Feeds</h2>
            <div className="space-y-2">
              {feeds?.slice(0, 5).map((feed: any) => (
                <div key={feed.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-gray-700 truncate">{feed.title}</span>
                  <span className="text-xs text-gray-500">{feed._count?.articles || 0}</span>
                </div>
              ))}
              <Link to="/feeds" className="text-sm text-primary-600 hover:text-primary-700">
                View all feeds →
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Your Feed</h1>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {articles?.length || 0} articles
              </span>
            </div>
          </div>

          {/* Articles List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : articles?.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600 mb-6">
                Add some RSS feeds to start reading articles
              </p>
              <Link to="/feeds" className="btn btn-primary">
                Add Your First Feed
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {articles?.map((article: Article) => (
                <div key={article.id} className={`card p-6 hover:shadow-md transition-shadow ${
                  article.readAt ? 'opacity-75' : ''
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {article.feed.title} • {new Date(article.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!article.readAt && (
                      <div className="h-2 w-2 bg-primary-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/article/${article.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        onClick={() => markAsRead(article.id)}
                      >
                        Read More
                      </Link>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Original
                      </a>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-primary-600 p-1">
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
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