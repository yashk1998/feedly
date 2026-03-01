'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Sparkles, Loader2, RefreshCw, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { api } from '@/lib/api-client'

interface DigestEntry {
  id: number
  articleCount: number
  content: string
  model: string | null
  sentAt: string | null
  createdAt: string
}

export default function DigestPage() {
  const [articleCount, setArticleCount] = useState(10)

  const { data: pastDigests, isLoading: digestsLoading, refetch } = useQuery({
    queryKey: ['digests'],
    queryFn: () => api.get('/ai/digests') as Promise<{ digests: DigestEntry[] }>,
  })

  const generateMutation = useMutation({
    mutationFn: () => api.post('/ai/digest', { articleCount }) as Promise<{ digest: string; model: string; cached: boolean }>,
    onSuccess: () => {
      toast.success('Digest generated!')
      refetch()
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to generate digest'),
  })

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-800 dark:text-ink-50 mb-2">Daily Digest</h1>
          <p className="text-ink-500 dark:text-ink-400">AI-generated summary of your latest unread articles</p>
        </div>

        {/* Generate new digest */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-1">Generate Digest</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Create a cohesive summary of your recent unread articles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-ink-600 dark:text-ink-300">Articles:</label>
              <select
                value={articleCount}
                onChange={(e) => setArticleCount(Number(e.target.value))}
                className="input w-20 py-1.5 text-sm"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="btn btn-primary"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Generate Digest</>
              )}
            </button>
          </div>

          {/* Current digest result */}
          {generateMutation.data && (
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-sage-50 to-parchment-200 dark:from-sage-950/30 dark:to-night-800 border border-sage-200 dark:border-sage-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sage-600 to-sage-700 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-display text-lg text-ink-800 dark:text-ink-50">Your Digest</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-sage-100 dark:bg-sage-900/50 text-sage-700 dark:text-sage-400">
                  {generateMutation.data.model}
                </span>
              </div>
              <div className="prose-article text-ink-600 dark:text-ink-200 leading-relaxed whitespace-pre-wrap">
                {generateMutation.data.digest}
              </div>
            </div>
          )}
        </div>

        {/* Past digests */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-ink-800 dark:text-ink-50">Past Digests</h2>
            <button onClick={() => refetch()} className="btn btn-ghost btn-sm">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {digestsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-parchment-300 dark:border-ink-700">
                  <div className="skeleton h-4 w-1/4 mb-2" />
                  <div className="skeleton h-3 w-full mb-1" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : !pastDigests?.digests || pastDigests.digests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
                <FileText className="h-8 w-8 text-ink-300 dark:text-ink-600" />
              </div>
              <h3 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-2">No digests yet</h3>
              <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
                Generate your first digest to get a summary of your unread articles.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastDigests.digests.map((digest: DigestEntry) => (
                <details key={digest.id} className="group rounded-xl border border-parchment-300 dark:border-ink-700 overflow-hidden">
                  <summary className="flex items-center gap-4 p-4 cursor-pointer hover:bg-parchment-50 dark:hover:bg-ink-700/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-sage-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-ink-800 dark:text-ink-50">
                        {format(new Date(digest.createdAt), 'MMMM d, yyyy')}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                        <span>{digest.articleCount} articles</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(digest.createdAt), 'h:mm a')}
                        </span>
                        {digest.model && <span>{digest.model}</span>}
                      </div>
                    </div>
                  </summary>
                  <div className="px-4 pb-4 pt-2 border-t border-parchment-200 dark:border-ink-700">
                    <div className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-wrap">
                      {digest.content}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
