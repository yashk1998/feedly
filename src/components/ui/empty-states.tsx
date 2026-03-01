'use client'

import Link from 'next/link'
import { Plus, Bookmark, Coffee, Sparkles } from 'lucide-react'

function AllCaughtUpIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-sage-500/20 to-coral-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
          <div className="absolute top-4 left-1/2 w-2 h-2 bg-sage-400 rounded-full" />
          <div className="absolute bottom-8 right-4 w-1.5 h-1.5 bg-coral-400 rounded-full" />
          <div className="absolute top-1/3 left-4 w-1 h-1 bg-sage-300 rounded-full" />
        </div>
        <div className="relative">
          <div className="absolute -inset-6 border-2 border-dashed border-sage-200 dark:border-sage-800/50 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
          <div className="relative w-28 h-28 bg-gradient-to-br from-sage-50 to-parchment-200 dark:from-sage-950/50 dark:to-night-800 rounded-full flex items-center justify-center shadow-lg shadow-sage-500/10">
            <div className="absolute inset-2 rounded-full border-2 border-sage-100 dark:border-sage-900/50" />
            <div className="relative">
              <Coffee className="w-12 h-12 text-sage-600" strokeWidth={1.5} />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-0.5 h-3 bg-gradient-to-t from-sage-400/60 to-transparent rounded-full animate-float" style={{ animationDelay: '0ms' }} />
                <div className="w-0.5 h-4 bg-gradient-to-t from-sage-400/60 to-transparent rounded-full animate-float" style={{ animationDelay: '200ms' }} />
                <div className="w-0.5 h-3 bg-gradient-to-t from-sage-400/60 to-transparent rounded-full animate-float" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>
          <div className="absolute -right-2 -top-2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce" style={{ animationDuration: '2s' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function NoSavedIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      <div className="absolute inset-8 bg-gradient-to-br from-sage-500/10 to-coral-500/10 rounded-full blur-2xl" />
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute top-4 right-8 animate-float" style={{ animationDelay: '100ms' }}>
          <Bookmark className="w-5 h-5 text-sage-300 dark:text-sage-700" fill="currentColor" />
        </div>
        <div className="absolute bottom-8 left-8 animate-float" style={{ animationDelay: '300ms' }}>
          <Bookmark className="w-4 h-4 text-coral-300 dark:text-coral-700" fill="currentColor" />
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-sage-500/20 rounded-2xl blur-xl transform translate-y-4" />
          <div className="relative w-20 h-28 bg-gradient-to-br from-sage-600 to-sage-700 rounded-t-2xl shadow-2xl shadow-sage-500/30">
            <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-1/2 h-6 bg-white dark:bg-night-900 transform origin-bottom-left skew-y-[20deg]" />
              <div className="absolute bottom-0 right-0 w-1/2 h-6 bg-white dark:bg-night-900 transform origin-bottom-right -skew-y-[20deg]" />
            </div>
            <div className="flex items-center justify-center h-20">
              <svg className="w-8 h-8 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-coral-400 animate-pulse" fill="currentColor" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AllCaughtUpState({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <AllCaughtUpIllustration />
      <div className="mt-8 space-y-3">
        <h3 className="font-display text-2xl text-ink-800 dark:text-ink-50">All caught up!</h3>
        <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto leading-relaxed">
          You&apos;ve read everything. Time for a well-deserved coffee break.
        </p>
      </div>
      <button onClick={onViewAll} className="mt-8 btn btn-secondary group">
        <span>View all articles</span>
        <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  )
}

export function NoFeedsState() {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
        <Plus className="h-8 w-8 text-sage-600" />
      </div>
      <div className="mt-4 space-y-3">
        <h3 className="font-display text-2xl text-ink-800 dark:text-ink-50">No feeds yet</h3>
        <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto leading-relaxed">
          Add your favorite blogs, news sites, and podcasts to start your personalized reading experience.
        </p>
      </div>
      <Link href="/feeds" className="mt-8 btn btn-primary group inline-flex">
        <Plus className="w-4 h-4 mr-2" />
        <span>Add your first feed</span>
      </Link>
    </div>
  )
}

export function NoSavedState() {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <NoSavedIllustration />
      <div className="mt-8 space-y-3">
        <h3 className="font-display text-2xl text-ink-800 dark:text-ink-50">Nothing saved yet</h3>
        <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto leading-relaxed">
          Save articles to read later by clicking the bookmark icon or pressing{' '}
          <kbd className="px-1.5 py-0.5 bg-parchment-200 dark:bg-ink-700 rounded text-xs font-mono">S</kbd> on any article.
        </p>
      </div>
      <Link href="/dashboard" className="mt-8 btn btn-secondary group inline-flex">
        <span>Browse articles</span>
        <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}

export function NoArticlesState() {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
        <Plus className="h-8 w-8 text-sage-600" />
      </div>
      <div className="mt-4 space-y-3">
        <h3 className="font-display text-2xl text-ink-800 dark:text-ink-50">No articles yet</h3>
        <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto leading-relaxed">
          Add some RSS feeds to start reading articles from your favorite sources.
        </p>
      </div>
      <Link href="/feeds" className="mt-8 btn btn-primary group inline-flex">
        <Plus className="w-4 h-4 mr-2" />
        <span>Add Your First Feed</span>
      </Link>
    </div>
  )
}
