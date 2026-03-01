'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Search, Home, Rss, Bookmark, Settings, Sun, Moon,
  Plus, Check, Keyboard, CreditCard, ArrowRight, Hash,
  X
} from 'lucide-react'
import { api } from '@/lib/api-client'
import type { Feed } from '@/types'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'feeds' | 'actions' | 'search'
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: feedsData } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => api.get('/feeds') as Promise<{ feeds: Feed[] }>,
    enabled: isOpen,
  })

  const { data: articlesData } = useQuery({
    queryKey: ['command-search', query],
    queryFn: () => api.get(`/articles?search=${encodeURIComponent(query)}&limit=5`) as Promise<{ articles: { id: number; title: string; feed: { title: string } }[] }>,
    enabled: isOpen && query.length > 1,
  })

  // Toggle with Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  const toggleDarkMode = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    close()
  }, [close])

  const markAllRead = useCallback(async () => {
    await api.post('/articles/mark-read', { all: true })
    queryClient.invalidateQueries({ queryKey: ['articles'] })
    queryClient.invalidateQueries({ queryKey: ['feeds'] })
    close()
  }, [queryClient, close])

  // Build and filter command items
  const allItems = useMemo(() => {
    const navigationItems: CommandItem[] = [
      { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to dashboard', icon: <Home className="h-4 w-4" />, action: () => { router.push('/dashboard'); close() }, category: 'navigation' },
      { id: 'nav-feeds', label: 'Feed Management', description: 'Manage your feeds', icon: <Rss className="h-4 w-4" />, action: () => { router.push('/feeds'); close() }, category: 'navigation' },
      { id: 'nav-saved', label: 'Saved Articles', description: 'View saved articles', icon: <Bookmark className="h-4 w-4" />, action: () => { router.push('/saved'); close() }, category: 'navigation' },
      { id: 'nav-settings', label: 'Settings', description: 'App settings', icon: <Settings className="h-4 w-4" />, action: () => { router.push('/settings'); close() }, category: 'navigation' },
      { id: 'nav-pricing', label: 'Pricing', description: 'Plans and pricing', icon: <CreditCard className="h-4 w-4" />, action: () => { router.push('/pricing'); close() }, category: 'navigation' },
    ]

    const isDark = document.documentElement.classList.contains('dark')
    const actionItems: CommandItem[] = [
      {
        id: 'action-theme', label: 'Toggle Dark Mode',
        description: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        icon: isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        action: toggleDarkMode, category: 'actions',
      },
      { id: 'action-add-feed', label: 'Add New Feed', description: 'Subscribe to a new RSS feed', icon: <Plus className="h-4 w-4" />, action: () => { router.push('/feeds'); close() }, category: 'actions' },
      { id: 'action-mark-read', label: 'Mark All as Read', description: 'Mark all articles as read', icon: <Check className="h-4 w-4" />, action: markAllRead, category: 'actions' },
      { id: 'action-shortcuts', label: 'Keyboard Shortcuts', description: 'View all shortcuts', icon: <Keyboard className="h-4 w-4" />, action: () => { close(); window.dispatchEvent(new CustomEvent('show-shortcuts')) }, category: 'actions' },
    ]

    const feedItems: CommandItem[] = (feedsData?.feeds || []).map((feed) => ({
      id: `feed-${feed.id}`,
      label: feed.title || 'Untitled Feed',
      description: feed.siteUrl || feed.url,
      icon: <Hash className="h-4 w-4" />,
      action: () => { router.push(`/dashboard?feedId=${feed.id}`); close() },
      category: 'feeds' as const,
    }))

    const searchResultItems: CommandItem[] = (articlesData?.articles || []).map((article) => ({
      id: `article-${article.id}`,
      label: article.title || 'Untitled',
      description: article.feed.title,
      icon: <ArrowRight className="h-4 w-4" />,
      action: () => { router.push(`/article/${article.id}`); close() },
      category: 'search' as const,
    }))

    const lowerQuery = query.toLowerCase()
    return query.length > 1
      ? [
          ...searchResultItems,
          ...navigationItems.filter((i) => i.label.toLowerCase().includes(lowerQuery)),
          ...feedItems.filter((i) => i.label.toLowerCase().includes(lowerQuery)),
          ...actionItems.filter((i) => i.label.toLowerCase().includes(lowerQuery)),
        ]
      : [...navigationItems, ...actionItems, ...feedItems.slice(0, 5)]
  }, [query, feedsData, articlesData, router, close, toggleDarkMode, markAllRead])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && allItems[selectedIndex]) {
        e.preventDefault()
        allItems[selectedIndex].action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allItems, selectedIndex])

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  const grouped = allItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels: Record<string, string> = {
    search: 'Search Results',
    navigation: 'Navigation',
    actions: 'Actions',
    feeds: 'Feeds',
  }

  let globalIndex = 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-ink-900/40 dark:bg-ink-900/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-lg bg-white dark:bg-night-800 rounded-2xl border border-parchment-300 dark:border-ink-700 shadow-elevated overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-parchment-200 dark:border-ink-700">
            <Search className="h-5 w-5 text-ink-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search articles, feeds, or type a command..."
              className="flex-1 bg-transparent text-ink-800 dark:text-ink-50 placeholder-ink-400 dark:placeholder-ink-500 text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={close}
              className="flex-shrink-0 p-1 rounded-lg text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-parchment-200 dark:hover:bg-ink-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
            {allItems.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-ink-400 dark:text-ink-500">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-5 py-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                    {categoryLabels[category] || category}
                  </div>
                  {items.map((item) => {
                    const idx = globalIndex++
                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                          selectedIndex === idx
                            ? 'bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400'
                            : 'text-ink-700 dark:text-ink-300 hover:bg-parchment-100 dark:hover:bg-ink-700'
                        }`}
                      >
                        <span className={`flex-shrink-0 ${selectedIndex === idx ? 'text-sage-600 dark:text-sage-400' : 'text-ink-400 dark:text-ink-500'}`}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-ink-400 dark:text-ink-500 truncate">{item.description}</div>
                          )}
                        </div>
                        {selectedIndex === idx && (
                          <kbd className="flex-shrink-0 text-xs text-ink-400 dark:text-ink-500 px-1.5 py-0.5 rounded bg-parchment-200 dark:bg-ink-700 font-mono">
                            ↵
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-parchment-200 dark:border-ink-700 flex items-center gap-4 text-xs text-ink-400 dark:text-ink-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-parchment-200 dark:bg-ink-700 font-mono">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-parchment-200 dark:bg-ink-700 font-mono">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-parchment-200 dark:bg-ink-700 font-mono">esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
