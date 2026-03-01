'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FeedIconProps {
  url: string | null | undefined
  title: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
}

const colors = [
  'bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-400',
  'bg-coral-100 text-coral-700 dark:bg-coral-900/30 dark:text-coral-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
]

function getColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function FeedIcon({ url, title, size = 'md' }: FeedIconProps) {
  const [imgError, setImgError] = useState(false)

  const hostname = url ? (() => {
    try { return new URL(url).hostname } catch { return '' }
  })() : ''

  const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : ''
  const initial = (title || hostname || '?')[0].toUpperCase()
  const colorClass = getColorFromString(title || hostname || 'default')

  const pxSize = size === 'sm' ? 24 : size === 'lg' ? 48 : 32

  if (faviconUrl && !imgError) {
    return (
      <Image
        src={faviconUrl}
        alt=""
        width={pxSize}
        height={pxSize}
        className={`${sizeClasses[size]} rounded-lg object-contain flex-shrink-0`}
        onError={() => setImgError(true)}
        unoptimized
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${colorClass} rounded-lg flex items-center justify-center font-semibold flex-shrink-0`}>
      {initial}
    </div>
  )
}
