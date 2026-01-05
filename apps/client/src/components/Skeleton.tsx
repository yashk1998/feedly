import { ReactNode } from 'react'

interface SkeletonProps {
  className?: string
  children?: ReactNode
}

// Base skeleton with shimmer effect
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-neutral-200 dark:bg-neutral-800 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  )
}

// Circular skeleton (for avatars)
export function SkeletonCircle({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />
}

// Text line skeleton
export function SkeletonText({ width = 'full', size = 'md' }: { width?: 'full' | '3/4' | '2/3' | '1/2' | '1/3' | '1/4'; size?: 'sm' | 'md' | 'lg' }) {
  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '2/3': 'w-2/3',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4'
  }

  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5'
  }

  return <Skeleton className={`${widthClasses[width]} ${sizeClasses[size]} rounded-md`} />
}

// Article card skeleton
export function ArticleCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex gap-4">
        {/* Unread dot placeholder */}
        <div className="pt-2 flex-shrink-0">
          <Skeleton className="w-2 h-2 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Meta row */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-lg" />
            <SkeletonText width="1/4" size="sm" />
            <Skeleton className="w-1 h-1 rounded-full" />
            <SkeletonText width="1/4" size="sm" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <SkeletonText width="full" size="lg" />
            <SkeletonText width="2/3" size="lg" />
          </div>

          {/* Summary */}
          <div className="space-y-1.5 pt-1">
            <SkeletonText width="full" size="sm" />
            <SkeletonText width="3/4" size="sm" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <SkeletonText width="1/4" size="sm" />
            <SkeletonText width="1/4" size="sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Feed item skeleton for sidebar
export function FeedItemSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
      <SkeletonText width="2/3" size="sm" />
      <Skeleton className="w-6 h-5 rounded-full ml-auto" />
    </div>
  )
}

// Sidebar skeleton
export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-2">
      {/* Category 1 */}
      <div>
        <div className="px-3 py-2">
          <SkeletonText width="1/3" size="sm" />
        </div>
        <div className="space-y-0.5">
          {[0, 1, 2].map((i) => (
            <FeedItemSkeleton key={i} index={i} />
          ))}
        </div>
      </div>

      {/* Category 2 */}
      <div>
        <div className="px-3 py-2">
          <SkeletonText width="1/4" size="sm" />
        </div>
        <div className="space-y-0.5">
          {[0, 1].map((i) => (
            <FeedItemSkeleton key={i} index={i + 3} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Full page loading skeleton
export function PageSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <SkeletonText width="1/3" size="lg" />
        </div>
        <SkeletonText width="1/2" size="sm" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <ArticleCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  )
}

// Article reader skeleton
export function ArticleReaderSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back button */}
      <div className="mb-8">
        <SkeletonText width="1/4" size="sm" />
      </div>

      {/* Article header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <SkeletonText width="1/4" size="sm" />
          <Skeleton className="w-1 h-1 rounded-full" />
          <SkeletonText width="1/4" size="sm" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <Skeleton className="w-full h-8 rounded-lg" />
          <Skeleton className="w-4/5 h-8 rounded-lg" />
        </div>
      </div>

      {/* Article content */}
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonText width="full" size="md" />
            <SkeletonText width="full" size="md" />
            <SkeletonText width={i % 3 === 0 ? '3/4' : i % 3 === 1 ? '2/3' : 'full'} size="md" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonText width="1/3" size="sm" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="w-1/2 h-8 rounded-lg mb-2" />
      <SkeletonText width="2/3" size="sm" />
    </div>
  )
}

// Generic skeleton container with staggered children
export function SkeletonList({
  count = 5,
  renderItem,
  className = ''
}: {
  count?: number
  renderItem: (index: number) => ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          {renderItem(i)}
        </div>
      ))}
    </div>
  )
}
