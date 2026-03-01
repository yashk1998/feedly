export function ArticleCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="card p-5 animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex gap-4">
        <div className="w-2 h-2 mt-2 rounded-full skeleton" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-5 w-3/4 mb-2" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-2/3 mb-4" />
          <div className="flex gap-4">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ArticleReaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div>
          <div className="skeleton h-4 w-32 mb-2" />
          <div className="skeleton h-3 w-48" />
        </div>
      </div>
      <div className="skeleton h-10 w-3/4 mb-4" />
      <div className="skeleton h-8 w-1/2 mb-8" />
      <div className="skeleton h-3 w-24 mb-12" />
      <div className="space-y-4">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  )
}

export function FeedCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="flex gap-4 p-4 rounded-xl border border-parchment-300 dark:border-ink-700 animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="skeleton w-10 h-10 rounded-lg" />
      <div className="flex-1">
        <div className="skeleton h-4 w-1/3 mb-2" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  )
}
