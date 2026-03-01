'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Clock, ExternalLink, ChevronRight, Bookmark, BookmarkX, Keyboard } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { api } from '@/lib/api-client'
import { useArticleNavigation } from '@/hooks/use-keyboard-shortcuts'
import KeyboardShortcutsModal from '@/components/ui/keyboard-shortcuts-modal'
import { NoSavedState } from '@/components/ui/empty-states'
import { ArticleCardSkeleton } from '@/components/ui/skeleton'
import type { Article } from '@/types'

export default function SavedArticles() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: articlesResponse, isLoading } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => api.get('/articles/saved') as Promise<{ articles: Article[] }>,
  })

  const markAsReadMutation = useMutation({
    mutationFn: (articleId: number) => api.post(`/articles/${articleId}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedArticles'] }),
  })

  const toggleReadMutation = useMutation({
    mutationFn: async (articleId: number) => {
      const article = articles.find((a) => a.id === articleId)
      if (article?.isRead) await api.post(`/articles/${articleId}/unread`)
      else await api.post(`/articles/${articleId}/read`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedArticles'] }),
  })

  const removeSavedMutation = useMutation({
    mutationFn: async (articleId: number) => {
      await api.delete(`/articles/${articleId}/save`)
      toast.success('Removed from saved')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedArticles'] }),
  })

  const articles = articlesResponse?.articles ?? []
  const filteredArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.feed.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles

  const formatPublishedDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    try { return formatDistanceToNow(new Date(dateString), { addSuffix: true }) } catch { return 'Unknown' }
  }

  const { showHelp, setShowHelp, shortcuts } = useArticleNavigation({
    articles: filteredArticles,
    selectedIndex: selectedArticleIndex,
    onSelect: setSelectedArticleIndex,
    onOpen: (articleId) => { markAsReadMutation.mutate(articleId); router.push(`/article/${articleId}`) },
    onToggleRead: (articleId) => toggleReadMutation.mutate(articleId),
    onSave: (articleId) => removeSavedMutation.mutate(articleId),
    enabled: !isLoading && filteredArticles.length > 0,
  })

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-sage-700 dark:text-sage-400" />
            </div>
            <h1 className="font-display text-3xl text-ink-800 dark:text-ink-50">Saved Articles</h1>
          </div>
          <p className="text-ink-500 dark:text-ink-400">Articles you&apos;ve saved for later reading</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" placeholder="Search saved articles..." className="input pl-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <ArticleCardSkeleton key={i} index={i} />)}</div>
        ) : filteredArticles.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
                <Search className="h-8 w-8 text-ink-300 dark:text-ink-600" />
              </div>
              <h3 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-2">No matching articles</h3>
              <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto">Try a different search term.</p>
            </div>
          ) : <NoSavedState />
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article, index) => (
              <article
                key={article.id}
                data-article-index={index}
                className={`article-card group animate-slide-up ${article.isRead ? 'read' : ''} ${selectedArticleIndex === index ? 'ring-2 ring-sage-600 ring-offset-2 dark:ring-offset-night-900' : ''}`}
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                onClick={() => setSelectedArticleIndex(index)}
              >
                <div className="flex gap-4">
                  <div className="pt-2 flex-shrink-0">
                    {!article.isRead ? <div className="unread-dot" /> : <div className="w-2 h-2 rounded-full bg-parchment-300 dark:bg-ink-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 text-sm text-ink-400">
                      <span className="font-medium text-ink-600 dark:text-ink-300">{article.feed.title || 'Unknown Feed'}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatPublishedDate(article.publishedAt)}</span>
                      <span>·</span>
                      <span className="text-sage-600 dark:text-sage-400">Saved {formatPublishedDate(article.savedAt)}</span>
                    </div>
                    <h2 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-2 line-clamp-2 group-hover:text-sage-700 dark:group-hover:text-sage-400 transition-colors">
                      <Link href={`/article/${article.id}`} onClick={() => markAsReadMutation.mutate(article.id)}>{article.title || 'Untitled'}</Link>
                    </h2>
                    {article.summary && <p className="text-ink-500 dark:text-ink-400 text-sm line-clamp-2 mb-3">{article.summary.replace(/<[^>]*>/g, '').slice(0, 200)}</p>}
                    <div className="flex items-center gap-4">
                      <Link href={`/article/${article.id}`} onClick={() => markAsReadMutation.mutate(article.id)} className="text-sm font-medium text-sage-700 hover:text-sage-800 dark:text-sage-400 flex items-center gap-1 transition-colors">
                        Read article<ChevronRight className="h-4 w-4" />
                      </Link>
                      {article.url && (
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 flex items-center gap-1 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />Original
                        </a>
                      )}
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeSavedMutation.mutate(article.id) }} className="text-sm text-ink-400 hover:text-error-500 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                        <BookmarkX className="h-3.5 w-3.5" />Remove
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowHelp(true)} className="fixed bottom-6 right-6 btn btn-secondary shadow-lg" title="Keyboard shortcuts (?)">
        <Keyboard className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Shortcuts</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-parchment-300 dark:bg-ink-700 text-xs font-mono">?</kbd>
      </button>
      <KeyboardShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} shortcuts={shortcuts} />
    </div>
  )
}
