import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Share2,
  Clock,
  Copy,
  Check,
  Twitter,
  Linkedin,
  MessageSquare,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import DOMPurify from 'dompurify'
import { formatDistanceToNow, format } from 'date-fns'
import { useApiClient } from '../lib/apiClient'

// Helper to check if content is substantial or just a summary
const isContentSubstantial = (content: string | null | undefined): boolean => {
  if (!content) return false
  // Strip HTML tags and check character length
  const textContent = content.replace(/<[^>]*>/g, '').trim()
  // Consider content substantial if it's more than 800 characters
  return textContent.length > 800
}

export default function ArticleReader() {
  const { id } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<string | null>(null)
  const [socialPost, setSocialPost] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'reddit'>('twitter')
  const [copied, setCopied] = useState(false)
  const api = useApiClient()
  const queryClient = useQueryClient()
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

  // Track if content fetch failed (for showing fallback UI)
  const [fetchFailed, setFetchFailed] = useState(false)

  // Mutation to fetch full article content from source URL
  const fetchContentMutation = useMutation(
    async () => {
      if (numericArticleId === null || Number.isNaN(numericArticleId)) {
        throw new Error('Invalid article id')
      }
      const response = await api.post(`/articles/${numericArticleId}/fetch-content`)
      return response.data
    },
    {
      onSuccess: (data) => {
        // Update the article in the cache with the new content
        queryClient.setQueryData(['article', id], data)
        setFetchFailed(false)
        toast.success('Full article loaded!')
      },
      onError: (error: any) => {
        setFetchFailed(true)
        const errorMsg = error.response?.data?.error || 'Could not load full article'
        toast.error(errorMsg, { duration: 4000 })
      }
    }
  )

  const handleCopyToClipboard = async (text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    try {
      const date = new Date(dateString)
      return `${format(date, 'MMMM d, yyyy')} (${formatDistanceToNow(date, { addSuffix: true })})`
    } catch {
      return 'Unknown date'
    }
  }

  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-ink-900">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="skeleton h-4 w-24 mb-8" />
          <div className="skeleton h-10 w-3/4 mb-4" />
          <div className="skeleton h-4 w-1/3 mb-12" />
          <div className="space-y-4">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-ink-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl text-ink-900 dark:text-paper-50 mb-4">
            Article not found
          </h1>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-900">
      {/* Header */}
      <header className="sticky top-16 z-10 bg-paper-50/80 dark:bg-ink-900/80 backdrop-blur-lg border-b border-paper-200 dark:border-ink-800">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-ink-500 hover:text-ink-900 dark:text-paper-400 dark:hover:text-paper-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to feed</span>
            </Link>

            <div className="flex items-center gap-2">
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Original
                </a>
              )}
              <button
                onClick={() => handleCopyToClipboard(article.url || window.location.href)}
                className="btn btn-ghost btn-sm"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1.5 text-success-500" />
                ) : (
                  <Share2 className="h-4 w-4 mr-1.5" />
                )}
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr,320px] gap-8 lg:gap-12">
          {/* Main content */}
          <article className="min-w-0">
            {/* Article header */}
            <header className="mb-8 lg:mb-12">
              <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-paper-400 mb-4">
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {article.feed?.title || 'Unknown Feed'}
                </span>
              </div>

              <h1 className="font-display text-3xl lg:text-4xl text-ink-900 dark:text-paper-50 leading-tight mb-4">
                {article.title || 'Untitled'}
              </h1>

              <div className="flex items-center gap-4 text-sm text-ink-500 dark:text-paper-400">
                {article.author && (
                  <span>By {article.author}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDate(article.publishedAt)}
                </span>
              </div>
            </header>

            {/* AI Summary (if generated) */}
            {summary && (
              <div className="card p-5 mb-8 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">AI Summary</h3>
                    <p className="text-amber-900 dark:text-amber-100 leading-relaxed">{summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Article content */}
            <div className="card p-6 lg:p-10">
              {/* Show content fetching UI if content is not substantial */}
              {!isContentSubstantial(article.content) && article.url && (
                <div className={`mb-6 p-4 border rounded-xl ${
                  fetchFailed
                    ? 'bg-paper-100 dark:bg-ink-800 border-paper-300 dark:border-ink-700'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {fetchFailed ? (
                      <ExternalLink className="h-5 w-5 text-ink-500 dark:text-paper-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {fetchFailed ? (
                        <>
                          <p className="text-sm text-ink-700 dark:text-paper-300 mb-3">
                            Full article content couldn't be extracted. This site may have content protection.
                            Read the complete article on the original website.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Read Original Article
                            </a>
                            <button
                              onClick={() => {
                                setFetchFailed(false)
                                fetchContentMutation.mutate()
                              }}
                              disabled={fetchContentMutation.isLoading}
                              className="btn btn-ghost btn-sm"
                            >
                              {fetchContentMutation.isLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                'Try Again'
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                            This article only shows a summary. Load the full content for a better reading experience.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => fetchContentMutation.mutate()}
                              disabled={fetchContentMutation.isLoading}
                              className="btn btn-primary btn-sm"
                            >
                              {fetchContentMutation.isLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading full article...
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Load Full Article
                                </>
                              )}
                            </button>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Read Original
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {article.content ? (
                <div
                  className="prose-article"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
                />
              ) : article.summary ? (
                <div
                  className="prose-article"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.summary) }}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-ink-500 dark:text-paper-400 mb-4">
                    Content not available.
                  </p>
                  {article.url && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => fetchContentMutation.mutate()}
                        disabled={fetchContentMutation.isLoading}
                        className="btn btn-primary"
                      >
                        {fetchContentMutation.isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Load Full Article
                          </>
                        )}
                      </button>
                      <span className="text-ink-400 dark:text-paper-500">or</span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Original
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* AI Summary Card */}
            <div className="card p-5 sticky top-32">
              <h3 className="font-display text-lg text-ink-900 dark:text-paper-50 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Tools
              </h3>

              {/* Generate Summary */}
              <div className="mb-6">
                <p className="text-sm text-ink-500 dark:text-paper-400 mb-3">
                  Get an AI-powered summary of this article.
                </p>
                <button
                  onClick={() => summaryMutation.mutate()}
                  disabled={summaryMutation.isLoading || !!summary}
                  className="btn btn-primary w-full"
                >
                  {summaryMutation.isLoading ? (
                    'Generating...'
                  ) : summary ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Summary Generated
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </button>
              </div>

              <div className="divider" />

              {/* Social Post Generator */}
              <div>
                <h4 className="font-medium text-ink-900 dark:text-paper-50 mb-3">
                  Generate Social Post
                </h4>

                <div className="flex gap-2 mb-3">
                  {[
                    { id: 'twitter', icon: Twitter, label: 'Twitter' },
                    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                    { id: 'reddit', icon: MessageSquare, label: 'Reddit' }
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id as any)}
                      className={`flex-1 p-2 rounded-xl border transition-all ${
                        selectedPlatform === platform.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                          : 'border-paper-200 dark:border-ink-700 text-ink-400 hover:border-ink-300'
                      }`}
                    >
                      <platform.icon className="h-4 w-4 mx-auto" />
                    </button>
                  ))}
                </div>

                {socialPost ? (
                  <div className="space-y-3">
                    <div className="bg-paper-100 dark:bg-ink-800 p-3 rounded-xl text-sm text-ink-700 dark:text-paper-300">
                      {socialPost}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyToClipboard(socialPost)}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          setSocialPost(null)
                          socialPostMutation.mutate(selectedPlatform)
                        }}
                        disabled={socialPostMutation.isLoading}
                        className="btn btn-ghost btn-sm flex-1"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => socialPostMutation.mutate(selectedPlatform)}
                    disabled={socialPostMutation.isLoading}
                    className="btn btn-secondary w-full"
                  >
                    {socialPostMutation.isLoading ? 'Generating...' : 'Generate Post'}
                  </button>
                )}
              </div>

              <div className="divider" />

              {/* Quick actions */}
              <div className="space-y-2">
                <button
                  onClick={() => handleCopyToClipboard(article.url || '')}
                  className="btn btn-ghost btn-sm w-full justify-start"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy article link
                </button>
                <button
                  onClick={() => handleCopyToClipboard(article.title || '')}
                  className="btn btn-ghost btn-sm w-full justify-start"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy title
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
