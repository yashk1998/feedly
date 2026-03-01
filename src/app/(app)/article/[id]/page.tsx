'use client'

import { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, ExternalLink, Sparkles, Share2, Clock, Copy, Check,
  Twitter, Linkedin, MessageSquare, FileText, Loader2, AlertCircle,
  Bookmark, BookOpen, ChevronUp, X, Languages, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'
import DOMPurify from 'dompurify'
import { format } from 'date-fns'
import { api } from '@/lib/api-client'
import { ArticleReaderSkeleton } from '@/components/ui/skeleton'
import FeedIcon from '@/components/ui/feed-icon'

function calculateReadTime(content: string | null | undefined): number {
  if (!content) return 1
  const text = content.replace(/<[^>]*>/g, '').trim()
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

function isContentSubstantial(content: string | null | undefined): boolean {
  if (!content) return false
  return content.replace(/<[^>]*>/g, '').trim().length > 800
}

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
]

export default function ArticleReader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [socialPost, setSocialPost] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'reddit'>('twitter')
  const [copied, setCopied] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [translateLang, setTranslateLang] = useState<string | null>(null)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  const queryClient = useQueryClient()
  const numericId = Number(id)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setReadProgress(docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0)
      setShowScrollTop(scrollTop > 500)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.get(`/articles/${numericId}`) as Promise<any>,
    enabled: !Number.isNaN(numericId),
  })

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (article?.isSaved) {
        await api.delete(`/articles/${numericId}/save`)
        toast.success('Removed from saved')
      } else {
        await api.post(`/articles/${numericId}/save`)
        toast.success('Saved for later')
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['article', id] }),
  })

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const data = await api.post('/ai/summarize', { articleId: numericId }) as any
      return data.summary
    },
    onSuccess: (data) => { setSummary(data); toast.success('Summary generated!') },
    onError: (error: any) => toast.error(error?.message || 'Failed to generate summary'),
  })

  const socialPostMutation = useMutation({
    mutationFn: async (platform: string) => {
      const data = await api.post('/ai/social-post', { articleId: numericId, platform }) as any
      return data.post
    },
    onSuccess: (data) => { setSocialPost(data); toast.success('Social post generated!') },
    onError: (error: any) => toast.error(error?.message || 'Failed to generate social post'),
  })

  // Auto-fetch AI summary on load (checks cache first, free if cached)
  useEffect(() => {
    if (!numericId || Number.isNaN(numericId)) return
    setSummaryLoading(true)
    api.post('/ai/summarize', { articleId: numericId })
      .then((data: any) => {
        if (data?.summary) setSummary(data.summary)
      })
      .catch(() => { /* silently fail — summary is optional */ })
      .finally(() => setSummaryLoading(false))
  }, [numericId])

  const translateMutation = useMutation({
    mutationFn: async (lang: string) => {
      const data = await api.post('/ai/translate', { articleId: numericId, targetLang: lang }) as any
      return data
    },
    onSuccess: (data: any) => {
      setTranslatedTitle(data.translatedTitle || null)
      setTranslatedContent(data.translatedContent || null)
      setTranslateLang(data.targetLang)
      toast.success(`Translated to ${LANGUAGES.find((l) => l.code === data.targetLang)?.name || data.targetLang}`)
    },
    onError: () => toast.error('Translation failed'),
  })

  const { data: similarData } = useQuery({
    queryKey: ['similar-articles', numericId],
    queryFn: () => api.get(`/clusters/similar/${numericId}?limit=5`) as Promise<{ similar: Array<{ id: number; title: string | null; url: string | null; feedTitle: string | null; similarity: number }> }>,
    enabled: !Number.isNaN(numericId),
  })

  const fetchContentMutation = useMutation({
    mutationFn: () => api.post(`/articles/${numericId}/fetch-content`) as Promise<any>,
    onSuccess: (data) => {
      queryClient.setQueryData(['article', id], data)
      setFetchFailed(false)
      toast.success('Full article loaded!')
    },
    onError: () => { setFetchFailed(true); toast.error('Could not load full article', { duration: 4000 }) },
  })

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    try { return format(new Date(dateString), 'MMMM d, yyyy') } catch { return 'Unknown date' }
  }

  const sanitizeHtml = (html: string) => DOMPurify.sanitize(html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
        <div className="max-w-3xl mx-auto px-6 py-12"><ArticleReaderSkeleton /></div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-parchment-100 dark:bg-night-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-ink-300 dark:text-ink-600" />
          </div>
          <h1 className="font-display text-2xl text-ink-800 dark:text-ink-50 mb-2">Article not found</h1>
          <p className="text-ink-500 dark:text-ink-400 mb-6">This article may have been removed or the link is invalid.</p>
          <Link href="/dashboard" className="btn btn-primary"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const readTime = calculateReadTime(article?.content || article?.summary)

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      {/* Reading progress */}
      <div className="fixed top-16 left-0 right-0 z-50 h-1 bg-parchment-300 dark:bg-ink-700">
        <div className="h-full bg-gradient-to-r from-sage-600 to-sage-500 transition-all duration-150 ease-out" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Sticky header */}
      <header className="sticky top-16 z-40 bg-parchment-100/90 dark:bg-night-900/90 backdrop-blur-xl border-b border-parchment-300 dark:border-ink-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-50 transition-colors group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium hidden sm:inline">Back to feed</span>
            </Link>
            <div className={`hidden md:flex items-center gap-3 transition-opacity duration-300 ${readProgress > 10 ? 'opacity-100' : 'opacity-0'}`}>
              <FeedIcon url={article.feed?.siteUrl || ''} title={article.feed?.title} size="sm" />
              <span className="text-sm text-ink-600 dark:text-ink-300 truncate max-w-xs">{article.title}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => toggleSaveMutation.mutate()} disabled={toggleSaveMutation.isPending} className={`btn btn-ghost btn-sm ${article.isSaved ? 'text-coral-500' : ''}`}>
                <Bookmark className={`h-4 w-4 ${article.isSaved ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline ml-1.5">{article.isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <button onClick={() => handleCopy(article.url || window.location.href)} className="btn btn-ghost btn-sm">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
                <span className="hidden sm:inline ml-1.5">Share</span>
              </button>
              {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink className="h-4 w-4" /><span className="hidden sm:inline ml-1.5">Original</span>
                </a>
              )}
              {/* Translate dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  disabled={translateMutation.isPending}
                  className={`btn btn-ghost btn-sm ${translateLang ? 'text-sage-600' : ''}`}
                >
                  {translateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                  <span className="hidden sm:inline ml-1.5">{translateLang ? LANGUAGES.find((l) => l.code === translateLang)?.name : 'Translate'}</span>
                </button>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <div className="absolute right-0 top-10 w-44 bg-white dark:bg-night-800 rounded-xl border border-parchment-300 dark:border-ink-700 shadow-elevated z-50 py-1 max-h-64 overflow-y-auto">
                      {translateLang && (
                        <button
                          onClick={() => { setTranslatedContent(null); setTranslatedTitle(null); setTranslateLang(null); setShowLangMenu(false) }}
                          className="w-full px-4 py-2 text-left text-sm text-coral-600 hover:bg-parchment-100 dark:hover:bg-ink-700"
                        >
                          Show Original
                        </button>
                      )}
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { translateMutation.mutate(lang.code); setShowLangMenu(false) }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-parchment-100 dark:hover:bg-ink-700 ${translateLang === lang.code ? 'text-sage-600 font-medium' : 'text-ink-700 dark:text-ink-300'}`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setShowAiPanel(!showAiPanel)} className={`btn btn-sm ${showAiPanel ? 'btn-primary' : 'btn-ghost'} lg:hidden`}>
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
            <header className="mb-10 lg:mb-14">
              <div className="flex items-center gap-3 mb-6">
                <FeedIcon url={article.feed?.siteUrl || ''} title={article.feed?.title} size="lg" />
                <div>
                  <span className="font-medium text-ink-700 dark:text-ink-50">{article.feed?.title || 'Unknown Source'}</span>
                  <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
                    <span>{formatDate(article.publishedAt)}</span><span>·</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readTime} min read</span>
                  </div>
                </div>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink-800 dark:text-ink-50 leading-[1.15] mb-6">{translatedTitle || article.title || 'Untitled'}</h1>
              {translateLang && (
                <div className="flex items-center gap-2 mb-4 text-sm text-sage-600 dark:text-sage-400">
                  <Languages className="h-4 w-4" />
                  <span>Translated to {LANGUAGES.find((l) => l.code === translateLang)?.name}</span>
                  <button onClick={() => { setTranslatedContent(null); setTranslatedTitle(null); setTranslateLang(null) }} className="underline text-xs hover:text-sage-700">Show original</button>
                </div>
              )}
              {article.author && (
                <p className="text-lg text-ink-600 dark:text-ink-300">
                  By <span className="font-medium text-ink-700 dark:text-ink-50">{article.author}</span>
                </p>
              )}
            </header>

            {/* AI Summary — auto-loaded from cache or generated on demand */}
            {summaryLoading ? (
              <div className="relative mb-10 p-6 rounded-2xl bg-gradient-to-br from-sage-50 to-parchment-200 dark:from-sage-950/30 dark:to-night-800 border border-sage-200 dark:border-sage-800/50 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sage-300 dark:bg-sage-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-sage-200 dark:bg-sage-800/50 rounded w-24" />
                    <div className="h-4 bg-sage-200 dark:bg-sage-800/50 rounded w-full" />
                    <div className="h-4 bg-sage-200 dark:bg-sage-800/50 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ) : summary ? (
              <div className="relative mb-10 p-6 rounded-2xl bg-gradient-to-br from-sage-50 to-parchment-200 dark:from-sage-950/30 dark:to-night-800 border border-sage-200 dark:border-sage-800/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-600 to-sage-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sage-500/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-2">AI Summary</h3>
                    <p className="text-ink-600 dark:text-ink-200 leading-relaxed">{summary}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-white dark:bg-night-800 rounded-2xl border border-parchment-300 dark:border-ink-700 p-6 sm:p-8 lg:p-12 shadow-sm">
              {!isContentSubstantial(article.content) && article.url && (
                <div className={`mb-8 p-5 rounded-xl border ${fetchFailed ? 'bg-parchment-200 dark:bg-ink-700/50 border-parchment-300 dark:border-ink-600' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'}`}>
                  <div className="flex items-start gap-4">
                    {fetchFailed ? <ExternalLink className="h-5 w-5 text-ink-500 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      {fetchFailed ? (
                        <>
                          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">Full article content couldn&apos;t be extracted.</p>
                          <div className="flex flex-wrap gap-3">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-accent btn-sm"><ExternalLink className="h-4 w-4 mr-2" />Read Original</a>
                            <button onClick={() => { setFetchFailed(false); fetchContentMutation.mutate() }} disabled={fetchContentMutation.isPending} className="btn btn-ghost btn-sm">
                              {fetchContentMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Retrying...</> : 'Try Again'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">This shows a preview. Load the full article for the best reading experience.</p>
                          <div className="flex flex-wrap gap-3">
                            <button onClick={() => fetchContentMutation.mutate()} disabled={fetchContentMutation.isPending} className="btn btn-accent btn-sm">
                              {fetchContentMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : <><FileText className="h-4 w-4 mr-2" />Load Full Article</>}
                            </button>
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><ExternalLink className="h-4 w-4 mr-2" />Read Original</a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {translatedContent ? (
                <div className="prose-article" dangerouslySetInnerHTML={{ __html: sanitizeHtml(translatedContent) }} />
              ) : article.content ? (
                <div className="prose-article" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
              ) : article.summary ? (
                <div className="prose-article" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.summary) }} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-ink-300 dark:text-ink-600" />
                  </div>
                  <p className="text-ink-500 dark:text-ink-400 mb-6">Content not available for this article.</p>
                  {article.url && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button onClick={() => fetchContentMutation.mutate()} disabled={fetchContentMutation.isPending} className="btn btn-accent">
                        {fetchContentMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : <><FileText className="h-4 w-4 mr-2" />Load Full Article</>}
                      </button>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"><ExternalLink className="h-4 w-4 mr-2" />Visit Original</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="mt-8 pt-8 border-t border-parchment-300 dark:border-ink-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-ink-500 hover:text-sage-700 dark:text-ink-400 dark:hover:text-sage-400 transition-colors group">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /><span className="text-sm font-medium">Back to feed</span>
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleSaveMutation.mutate()} disabled={toggleSaveMutation.isPending} className={`btn btn-sm ${article.isSaved ? 'btn-accent' : 'btn-secondary'}`}>
                    <Bookmark className={`h-4 w-4 mr-1.5 ${article.isSaved ? 'fill-current' : ''}`} />{article.isSaved ? 'Saved' : 'Save Article'}
                  </button>
                  {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"><ExternalLink className="h-4 w-4 mr-1.5" />Original</a>}
                </div>
              </div>
            </footer>
          </article>

          {/* Sidebar - AI Tools */}
          <aside className={`${showAiPanel ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden lg:block'}`}>
            <div className={`${showAiPanel ? 'absolute right-0 top-0 bottom-0 w-80 bg-parchment-100 dark:bg-night-900 overflow-y-auto' : ''} lg:sticky lg:top-32 space-y-6`}>
              {showAiPanel && (
                <div className="flex items-center justify-between p-4 border-b border-parchment-300 dark:border-ink-700 lg:hidden">
                  <h3 className="font-display text-lg">AI Tools</h3>
                  <button onClick={() => setShowAiPanel(false)} className="p-2 hover:bg-parchment-200 dark:hover:bg-ink-700 rounded-lg"><X className="h-5 w-5" /></button>
                </div>
              )}
              <div className={`${showAiPanel ? 'p-4' : ''} lg:p-0`}>
                <div className="bg-white dark:bg-night-800 rounded-2xl border border-parchment-300 dark:border-ink-700 p-5 shadow-sm">
                  <h3 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-sage-600" />AI Tools
                  </h3>
                  <div className="mb-6">
                    <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">Get an AI-powered summary of this article.</p>
                    <button onClick={() => summaryMutation.mutate()} disabled={summaryMutation.isPending || !!summary} className="btn btn-primary w-full">
                      {summaryMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : summary ? <><Check className="h-4 w-4 mr-2" />Summary Generated</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Summary</>}
                    </button>
                  </div>
                  <div className="h-px bg-parchment-300 dark:bg-ink-700 my-5" />
                  <div>
                    <h4 className="font-medium text-ink-800 dark:text-ink-50 mb-3">Generate Social Post</h4>
                    <div className="flex gap-2 mb-3">
                      {([{ id: 'twitter', icon: Twitter }, { id: 'linkedin', icon: Linkedin }, { id: 'reddit', icon: MessageSquare }] as const).map((p) => (
                        <button key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`flex-1 p-2.5 rounded-xl border-2 transition-all ${selectedPlatform === p.id ? 'border-sage-600 bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400' : 'border-parchment-300 dark:border-ink-600 text-ink-400 dark:text-ink-500'}`}>
                          <p.icon className="h-4 w-4 mx-auto" />
                        </button>
                      ))}
                    </div>
                    {socialPost ? (
                      <div className="space-y-3">
                        <div className="bg-parchment-200 dark:bg-ink-700 p-4 rounded-xl text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{socialPost}</div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopy(socialPost)} className="btn btn-secondary btn-sm flex-1"><Copy className="h-4 w-4 mr-1.5" />Copy</button>
                          <button onClick={() => { setSocialPost(null); socialPostMutation.mutate(selectedPlatform) }} disabled={socialPostMutation.isPending} className="btn btn-ghost btn-sm flex-1">Regenerate</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => socialPostMutation.mutate(selectedPlatform)} disabled={socialPostMutation.isPending} className="btn btn-secondary w-full">
                        {socialPostMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : 'Generate Post'}
                      </button>
                    )}
                  </div>
                  <div className="h-px bg-parchment-300 dark:bg-ink-700 my-5" />
                  <div className="space-y-1">
                    <button onClick={() => handleCopy(article.url || '')} className="btn btn-ghost btn-sm w-full justify-start"><Copy className="h-4 w-4 mr-2" />Copy article link</button>
                    <button onClick={() => handleCopy(article.title || '')} className="btn btn-ghost btn-sm w-full justify-start"><Copy className="h-4 w-4 mr-2" />Copy title</button>
                  </div>
                </div>

                {/* Similar Articles */}
                {similarData?.similar && similarData.similar.length > 0 && (
                  <div className="bg-white dark:bg-night-800 rounded-2xl border border-parchment-300 dark:border-ink-700 p-5 shadow-sm mt-6">
                    <h3 className="font-display text-base text-ink-800 dark:text-ink-50 mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sage-600" />Similar Articles
                    </h3>
                    <div className="space-y-3">
                      {similarData.similar.map((sa) => (
                        <Link
                          key={sa.id}
                          href={`/article/${sa.id}`}
                          className="block group"
                        >
                          <p className="text-sm text-ink-700 dark:text-ink-200 group-hover:text-sage-700 dark:group-hover:text-sage-400 transition-colors line-clamp-2">
                            {sa.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-ink-400 dark:text-ink-500">
                            <span>{sa.feedTitle}</span>
                            <span className="px-1.5 py-0.5 rounded bg-sage-100 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400">
                              {Math.round(sa.similarity * 100)}% match
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`fixed bottom-6 right-6 w-12 h-12 bg-white dark:bg-ink-700 border border-parchment-300 dark:border-ink-600 rounded-full shadow-lg flex items-center justify-center text-ink-600 dark:text-ink-300 hover:text-sage-600 transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  )
}
