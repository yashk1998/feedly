import { useState, useEffect, useRef } from 'react'
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
  AlertCircle,
  Bookmark,
  BookOpen,
  ChevronUp,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import DOMPurify from 'dompurify'
import { formatDistanceToNow, format } from 'date-fns'
import { useApiClient } from '../lib/apiClient'
import { ArticleReaderSkeleton } from '../components/Skeleton'
import FeedIcon from '../components/FeedIcon'

// Calculate estimated read time (avg 200 words per minute)
function calculateReadTime(content: string | null | undefined): number {
  if (!content) return 1
  const text = content.replace(/<[^>]*>/g, '').trim()
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

// Helper to check if content is substantial or just a summary
const isContentSubstantial = (content: string | null | undefined): boolean => {
  if (!content) return false
  const textContent = content.replace(/<[^>]*>/g, '').trim()
  return textContent.length > 800
}

export default function ArticleReader() {
  const { id } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<string | null>(null)
  const [socialPost, setSocialPost] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'reddit'>('twitter')
  const [copied, setCopied] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  const api = useApiClient()
  const queryClient = useQueryClient()
  const numericArticleId = id ? Number(id) : null

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setReadProgress(Math.min(100, Math.max(0, progress)))
      setShowScrollTop(scrollTop > 500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Save/unsave article mutation
  const toggleSaveMutation = useMutation(
    async () => {
      if (article?.isSaved) {
        await api.delete(`/articles/${numericArticleId}/save`)
        toast.success('Removed from saved')
      } else {
        await api.post(`/articles/${numericArticleId}/save`)
        toast.success('Saved for later')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['article', id])
      }
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

  const [fetchFailed, setFetchFailed] = useState(false)

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    try {
      const date = new Date(dateString)
      return format(date, 'MMMM d, yyyy')
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

  const readTime = calculateReadTime(article?.content || article?.summary)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-midnight-950">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <ArticleReaderSkeleton />
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-midnight-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-ink-300 dark:text-neutral-600" />
          </div>
          <h1 className="font-display text-2xl text-ink-900 dark:text-white mb-2">
            Article not found
          </h1>
          <p className="text-ink-500 dark:text-neutral-400 mb-6">
            This article may have been removed or the link is invalid.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-midnight-950">
      {/* Reading progress bar */}
      <div className="fixed top-16 left-0 right-0 z-50 h-1 bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-gradient-to-r from-coral-500 to-orange-500 transition-all duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Sticky header */}
      <header className="sticky top-16 z-40 bg-paper-50/90 dark:bg-midnight-950/90 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-ink-500 hover:text-ink-900 dark:text-neutral-400 dark:hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium hidden sm:inline">Back to feed</span>
            </Link>

            {/* Center - Article info (visible on scroll) */}
            <div className={`hidden md:flex items-center gap-3 transition-opacity duration-300 ${readProgress > 10 ? 'opacity-100' : 'opacity-0'}`}>
              <FeedIcon url={article.feed?.siteUrl || article.feed?.url || ''} title={article.feed?.title} size="sm" />
              <span className="text-sm text-ink-600 dark:text-neutral-300 truncate max-w-xs">
                {article.title}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => toggleSaveMutation.mutate()}
                disabled={toggleSaveMutation.isLoading}
                className={`btn btn-ghost btn-sm ${article.isSaved ? 'text-coral-500' : ''}`}
                title={article.isSaved ? 'Remove from saved' : 'Save for later'}
              >
                <Bookmark className={`h-4 w-4 ${article.isSaved ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline ml-1.5">{article.isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={() => handleCopyToClipboard(article.url || window.location.href)}
                className="btn btn-ghost btn-sm"
                title="Share"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-1.5">Share</span>
              </button>

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  title="Read original"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Original</span>
                </a>
              )}

              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className={`btn btn-sm ${showAiPanel ? 'btn-primary' : 'btn-ghost'} lg:hidden`}
                title="AI Tools"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr,320px] gap-8 lg:gap-12">
          {/* Main content */}
          <article ref={articleRef} className="min-w-0">
            {/* Article header */}
            <header className="mb-10 lg:mb-14">
              {/* Source badge */}
              <div className="flex items-center gap-3 mb-6">
                <FeedIcon url={article.feed?.siteUrl || article.feed?.url || ''} title={article.feed?.title} size="lg" />
                <div>
                  <span className="font-medium text-ink-800 dark:text-white">
                    {article.feed?.title || 'Unknown Source'}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-neutral-400">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {readTime} min read
                    </span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink-900 dark:text-white leading-[1.15] mb-6">
                {article.title || 'Untitled'}
              </h1>

              {/* Author */}
              {article.author && (
                <p className="text-lg text-ink-600 dark:text-neutral-300">
                  By <span className="font-medium text-ink-800 dark:text-white">{article.author}</span>
                </p>
              )}
            </header>

            {/* AI Summary (if generated) */}
            {summary && (
              <div className="relative mb-10 p-6 rounded-2xl bg-gradient-to-br from-coral-50 to-orange-50 dark:from-coral-950/30 dark:to-orange-950/20 border border-coral-200 dark:border-coral-800/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-coral-500/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-ink-900 dark:text-white mb-2">AI Summary</h3>
                    <p className="text-ink-700 dark:text-neutral-200 leading-relaxed">{summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Article content */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 lg:p-12 shadow-sm">
              {/* Show content fetching UI if content is not substantial */}
              {!isContentSubstantial(article.content) && article.url && (
                <div className={`mb-8 p-5 rounded-xl border ${
                  fetchFailed
                    ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                }`}>
                  <div className="flex items-start gap-4">
                    {fetchFailed ? (
                      <ExternalLink className="h-5 w-5 text-ink-500 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {fetchFailed ? (
                        <>
                          <p className="text-sm text-ink-700 dark:text-neutral-300 mb-4">
                            Full article content couldn't be extracted. This site may have content protection.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Read Original
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
                          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                            This shows a preview. Load the full article for the best reading experience.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => fetchContentMutation.mutate()}
                              disabled={fetchContentMutation.isLoading}
                              className="btn btn-primary btn-sm"
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-ink-300 dark:text-neutral-600" />
                  </div>
                  <p className="text-ink-500 dark:text-neutral-400 mb-6">
                    Content not available for this article.
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

            {/* Article footer */}
            <footer className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-ink-500 hover:text-coral-600 dark:text-neutral-400 dark:hover:text-coral-400 transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span className="text-sm font-medium">Back to feed</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSaveMutation.mutate()}
                    disabled={toggleSaveMutation.isLoading}
                    className={`btn btn-sm ${article.isSaved ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <Bookmark className={`h-4 w-4 mr-1.5 ${article.isSaved ? 'fill-current' : ''}`} />
                    {article.isSaved ? 'Saved' : 'Save Article'}
                  </button>
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Original
                    </a>
                  )}
                </div>
              </div>
            </footer>
          </article>

          {/* Sidebar - AI Tools */}
          <aside className={`${showAiPanel ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden lg:block'}`}>
            <div className={`${showAiPanel ? 'absolute right-0 top-0 bottom-0 w-80 bg-paper-50 dark:bg-midnight-950 overflow-y-auto' : ''} lg:sticky lg:top-32 space-y-6`}>
              {/* Mobile close button */}
              {showAiPanel && (
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 lg:hidden">
                  <h3 className="font-display text-lg">AI Tools</h3>
                  <button onClick={() => setShowAiPanel(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className={`${showAiPanel ? 'p-4' : ''} lg:p-0`}>
                {/* AI Summary Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                  <h3 className="font-display text-lg text-ink-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-coral-500" />
                    AI Tools
                  </h3>

                  {/* Generate Summary */}
                  <div className="mb-6">
                    <p className="text-sm text-ink-500 dark:text-neutral-400 mb-3">
                      Get an AI-powered summary of this article.
                    </p>
                    <button
                      onClick={() => summaryMutation.mutate()}
                      disabled={summaryMutation.isLoading || !!summary}
                      className="btn btn-primary w-full"
                    >
                      {summaryMutation.isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
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

                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-5" />

                  {/* Social Post Generator */}
                  <div>
                    <h4 className="font-medium text-ink-900 dark:text-white mb-3">
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
                          className={`flex-1 p-2.5 rounded-xl border-2 transition-all ${
                            selectedPlatform === platform.id
                              ? 'border-coral-500 bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400'
                              : 'border-neutral-200 dark:border-neutral-700 text-ink-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                          }`}
                        >
                          <platform.icon className="h-4 w-4 mx-auto" />
                        </button>
                      ))}
                    </div>

                    {socialPost ? (
                      <div className="space-y-3">
                        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl text-sm text-ink-700 dark:text-neutral-300 leading-relaxed">
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
                        {socialPostMutation.isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate Post'
                        )}
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-5" />

                  {/* Quick actions */}
                  <div className="space-y-1">
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
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 w-12 h-12 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-lg flex items-center justify-center text-ink-600 dark:text-neutral-300 hover:text-coral-500 dark:hover:text-coral-400 hover:border-coral-500 dark:hover:border-coral-500 transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        title="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  )
}
