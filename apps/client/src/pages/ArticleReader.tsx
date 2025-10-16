import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { ArrowLeft, ExternalLink, Sparkles, Share2, Clock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { useApiClient } from '../lib/apiClient'

export default function ArticleReader() {
  const { id } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<string | null>(null)
  const [socialPost, setSocialPost] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'reddit'>('twitter')
  const api = useApiClient()
  const numericArticleId = id ? Number(id) : null

  const { data: article, isLoading } = useQuery(
    ['article', id],
    async () => {
      if (numericArticleId === null || Number.isNaN(numericArticleId)) {
        throw new Error('Invalid article id')
      }
      const response = await api.get(`/articles/${numericArticleId}`)
      return response.data
    },
    {
      onSuccess: (data) => {
        // Mark as read when article is loaded
        if (!data.readAt) {
          api.post(`/articles/${numericArticleId}/read`).catch(console.error)
        }
      },
      enabled: numericArticleId !== null && !Number.isNaN(numericArticleId)
    }
  )

  const summaryMutation = useMutation(
    async () => {
      if (numericArticleId === null || Number.isNaN(numericArticleId)) {
        throw new Error('Invalid article id')
      }
      const response = await api.post(`/ai/summarize`, {
        articleId: numericArticleId
      })
      return response.data.summary
    },
    {
      onSuccess: (data) => {
        setSummary(data)
        toast.success('Summary generated!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to generate summary')
      }
    }
  )

  const socialPostMutation = useMutation(
    async (platform: string) => {
      if (numericArticleId === null || Number.isNaN(numericArticleId)) {
        throw new Error('Invalid article id')
      }
      const response = await api.post(`/ai/social-post`, {
        articleId: numericArticleId,
        platform
      })
      return response.data.post
    },
    {
      onSuccess: (data) => {
        setSocialPost(data)
        toast.success('Social post generated!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to generate social post')
      }
    }
  )

  const handleGenerateSocialPost = () => {
    socialPostMutation.mutate(selectedPlatform)
  }

  const handleCopyToClipboard = (text: string) => {
    if (!text) {
      return
    }
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {article.feed.title || 'Unknown Feed'}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Unknown'}
          </div>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Original Article
            </a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="card p-8">
            {article.summary && (
              <div className="text-lg text-gray-700 mb-6 font-medium">
                {article.summary}
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              {article.content ? (
                <ReactMarkdown>{article.content}</ReactMarkdown>
              ) : (
                <p className="text-gray-600">
                  Content not available. Please visit the original article.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary-600" />
              AI Summary
            </h3>
            
            {summary ? (
              <div>
                <p className="text-gray-700 text-sm mb-4">{summary}</p>
                <button
                  onClick={() => handleCopyToClipboard(summary)}
                  className="btn btn-outline btn-sm w-full"
                >
                  Copy Summary
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Generate an AI-powered summary of this article.
                </p>
                <button
                  onClick={() => summaryMutation.mutate()}
                  disabled={summaryMutation.isLoading}
                  className="btn btn-primary btn-sm w-full"
                >
                  {summaryMutation.isLoading ? 'Generating...' : 'Generate Summary'}
                </button>
              </div>
            )}
          </div>

          {/* Social Sharing */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-primary-600" />
              Social Sharing
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  className="input text-sm"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as any)}
                >
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="reddit">Reddit</option>
                </select>
              </div>
              
              {socialPost ? (
                <div>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-3">
                    {socialPost}
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCopyToClipboard(socialPost)}
                      className="btn btn-outline btn-sm w-full"
                    >
                      Copy Post
                    </button>
                    <button
                      onClick={handleGenerateSocialPost}
                      disabled={socialPostMutation.isLoading}
                      className="btn btn-secondary btn-sm w-full"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateSocialPost}
                  disabled={socialPostMutation.isLoading}
                  className="btn btn-primary btn-sm w-full"
                >
                  {socialPostMutation.isLoading ? 'Generating...' : 'Generate Post'}
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleCopyToClipboard(article.url || '')}
                className="btn btn-outline btn-sm w-full"
              >
                Copy Link
              </button>
              <button
                onClick={() => handleCopyToClipboard(article.title || '')}
                className="btn btn-outline btn-sm w-full"
              >
                Copy Title
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 