import { useState, useEffect } from 'react'

interface FeedIconProps {
  url: string
  title?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Generate a consistent color based on string hash
function stringToColor(str: string): { bg: string; text: string } {
  const colors = [
    { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-600 dark:text-rose-400' },
    { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400' },
    { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-400' },
    { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-600 dark:text-yellow-400' },
    { bg: 'bg-lime-100 dark:bg-lime-900/40', text: 'text-lime-600 dark:text-lime-400' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-600 dark:text-teal-400' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-600 dark:text-cyan-400' },
    { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-600 dark:text-sky-400' },
    { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-600 dark:text-indigo-400' },
    { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-600 dark:text-violet-400' },
    { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400' },
    { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
    { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-600 dark:text-pink-400' },
  ]

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Extract domain from URL
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

// Get first letter(s) for avatar
function getInitials(title: string | null | undefined, url: string): string {
  if (title) {
    // Get first letter of first two words
    const words = title.split(/\s+/).filter(w => w.length > 0)
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return title.slice(0, 2).toUpperCase()
  }

  // Fall back to domain
  const domain = getDomain(url)
  return domain.slice(0, 2).toUpperCase()
}

export default function FeedIcon({ url, title, size = 'md', className = '' }: FeedIconProps) {
  const [imgError, setImgError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const domain = getDomain(url)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm'
  }

  const colors = stringToColor(title || domain)
  const initials = getInitials(title, url)

  // Reset error state when URL changes
  useEffect(() => {
    setImgError(false)
    setIsLoading(true)
  }, [url])

  return (
    <div
      className={`relative rounded-lg overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {/* Loading shimmer */}
      {isLoading && !imgError && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
      )}

      {/* Favicon image */}
      {!imgError && (
        <img
          src={faviconUrl}
          alt=""
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImgError(true)
            setIsLoading(false)
          }}
        />
      )}

      {/* Fallback avatar */}
      {imgError && (
        <div
          className={`w-full h-full flex items-center justify-center font-semibold ${colors.bg} ${colors.text}`}
        >
          {initials}
        </div>
      )}
    </div>
  )
}

// Variant with ring/border for emphasis
export function FeedIconWithRing({ url, title, size = 'md', className = '' }: FeedIconProps) {
  return (
    <div className={`p-0.5 rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 ${className}`}>
      <FeedIcon url={url} title={title} size={size} />
    </div>
  )
}
