import { Link } from 'react-router-dom'
import { Plus, Bookmark, Coffee, Sparkles } from 'lucide-react'

// Animated illustration for "All caught up" state
function AllCaughtUpIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-coral-500/20 to-orange-500/10 rounded-full blur-3xl animate-pulse-slow" />

      {/* Main circle with checkmark */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
          <div className="absolute top-4 left-1/2 w-2 h-2 bg-coral-400 rounded-full" />
          <div className="absolute bottom-8 right-4 w-1.5 h-1.5 bg-orange-400 rounded-full" />
          <div className="absolute top-1/3 left-4 w-1 h-1 bg-coral-300 rounded-full" />
        </div>

        {/* Central element */}
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute -inset-6 border-2 border-dashed border-coral-200 dark:border-coral-800/50 rounded-full animate-[spin_30s_linear_infinite_reverse]" />

          {/* Main circle */}
          <div className="relative w-28 h-28 bg-gradient-to-br from-coral-50 to-orange-50 dark:from-coral-950/50 dark:to-orange-950/30 rounded-full flex items-center justify-center shadow-lg shadow-coral-500/10">
            {/* Inner gradient ring */}
            <div className="absolute inset-2 rounded-full border-2 border-coral-100 dark:border-coral-900/50" />

            {/* Coffee cup icon with steam */}
            <div className="relative">
              <Coffee className="w-12 h-12 text-coral-500" strokeWidth={1.5} />
              {/* Steam lines */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-0.5 h-3 bg-gradient-to-t from-coral-400/60 to-transparent rounded-full animate-float" style={{ animationDelay: '0ms' }} />
                <div className="w-0.5 h-4 bg-gradient-to-t from-coral-400/60 to-transparent rounded-full animate-float" style={{ animationDelay: '200ms' }} />
                <div className="w-0.5 h-3 bg-gradient-to-t from-coral-400/60 to-transparent rounded-full animate-float" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>

          {/* Floating checkmark badge */}
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

// Illustration for empty feeds
function NoFeedsIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Background shapes */}
      <div className="absolute inset-0">
        {/* Floating RSS symbols */}
        <div className="absolute top-6 left-6 opacity-20 animate-float" style={{ animationDelay: '0ms' }}>
          <svg className="w-8 h-8 text-coral-500" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="18" r="3"/>
            <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
          </svg>
        </div>
        <div className="absolute bottom-12 right-8 opacity-15 animate-float" style={{ animationDelay: '500ms' }}>
          <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="18" r="3"/>
            <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
          </svg>
        </div>
      </div>

      {/* Main card stack */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Back cards */}
        <div className="absolute w-32 h-20 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl transform rotate-6 translate-y-2 opacity-40" />
        <div className="absolute w-32 h-20 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl transform -rotate-3 translate-y-1 opacity-60" />

        {/* Main card */}
        <div className="relative w-36 h-24 bg-white dark:bg-neutral-800 rounded-xl shadow-xl shadow-neutral-200/50 dark:shadow-black/30 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center gap-2 p-4">
          {/* Plus icon */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-orange-500 flex items-center justify-center shadow-lg shadow-coral-500/30">
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          {/* Lines placeholder */}
          <div className="w-full space-y-1.5">
            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-full" />
            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Illustration for no saved articles
function NoSavedIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Background glow */}
      <div className="absolute inset-8 bg-gradient-to-br from-violet-500/10 to-coral-500/10 rounded-full blur-2xl" />

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Floating bookmarks */}
        <div className="absolute top-4 right-8 animate-float" style={{ animationDelay: '100ms' }}>
          <Bookmark className="w-5 h-5 text-coral-300 dark:text-coral-700" fill="currentColor" />
        </div>
        <div className="absolute bottom-8 left-8 animate-float" style={{ animationDelay: '300ms' }}>
          <Bookmark className="w-4 h-4 text-violet-300 dark:text-violet-700" fill="currentColor" />
        </div>
        <div className="absolute top-12 left-12 animate-float" style={{ animationDelay: '600ms' }}>
          <Bookmark className="w-3 h-3 text-orange-300 dark:text-orange-700" fill="currentColor" />
        </div>

        {/* Main bookmark with heart */}
        <div className="relative">
          {/* Shadow */}
          <div className="absolute inset-0 bg-coral-500/20 rounded-2xl blur-xl transform translate-y-4" />

          {/* Main bookmark shape */}
          <div className="relative w-20 h-28 bg-gradient-to-br from-coral-500 to-orange-500 rounded-t-2xl shadow-2xl shadow-coral-500/30">
            {/* Bookmark notch */}
            <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-1/2 h-6 bg-white dark:bg-midnight-950 transform origin-bottom-left skew-y-[20deg]" />
              <div className="absolute bottom-0 right-0 w-1/2 h-6 bg-white dark:bg-midnight-950 transform origin-bottom-right -skew-y-[20deg]" />
            </div>

            {/* Heart icon */}
            <div className="flex items-center justify-center h-20">
              <svg className="w-8 h-8 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>

          {/* Sparkle */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" fill="currentColor" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Empty state for "All caught up"
export function AllCaughtUpState({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <AllCaughtUpIllustration />

      <div className="mt-8 space-y-3">
        <h3 className="font-display text-2xl text-ink-900 dark:text-white">
          All caught up!
        </h3>
        <p className="text-ink-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
          You've read everything. Time for a well-deserved coffee break.
        </p>
      </div>

      <button
        onClick={onViewAll}
        className="mt-8 btn btn-secondary group"
      >
        <span>View all articles</span>
        <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  )
}

// Empty state for no feeds
export function NoFeedsState() {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <NoFeedsIllustration />

      <div className="mt-8 space-y-3">
        <h3 className="font-display text-2xl text-ink-900 dark:text-white">
          No feeds yet
        </h3>
        <p className="text-ink-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
          Add your favorite blogs, news sites, and podcasts to start your personalized reading experience.
        </p>
      </div>

      <Link to="/feeds" className="mt-8 btn btn-primary group inline-flex">
        <Plus className="w-4 h-4 mr-2" />
        <span>Add your first feed</span>
      </Link>

      {/* Suggestions */}
      <div className="mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-neutral-500 font-medium mb-4">
          Popular feeds to get started
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['TechCrunch', 'Hacker News', 'The Verge', 'Ars Technica'].map((name) => (
            <span key={name} className="px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-ink-600 dark:text-neutral-300 rounded-full">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Empty state for no saved articles
export function NoSavedState() {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <NoSavedIllustration />

      <div className="mt-8 space-y-3">
        <h3 className="font-display text-2xl text-ink-900 dark:text-white">
          Nothing saved yet
        </h3>
        <p className="text-ink-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
          Save articles to read later by clicking the bookmark icon or pressing <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono">S</kbd> on any article.
        </p>
      </div>

      <Link to="/dashboard" className="mt-8 btn btn-secondary group inline-flex">
        <span>Browse articles</span>
        <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}

// Empty state for no articles (generic)
export function NoArticlesState() {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <NoFeedsIllustration />

      <div className="mt-8 space-y-3">
        <h3 className="font-display text-2xl text-ink-900 dark:text-white">
          No articles yet
        </h3>
        <p className="text-ink-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
          Add some RSS feeds to start reading articles from your favorite sources.
        </p>
      </div>

      <Link to="/feeds" className="mt-8 btn btn-primary group inline-flex">
        <Plus className="w-4 h-4 mr-2" />
        <span>Add Your First Feed</span>
      </Link>
    </div>
  )
}
