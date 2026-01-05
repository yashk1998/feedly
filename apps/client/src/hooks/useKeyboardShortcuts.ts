import { useEffect, useCallback, useState } from 'react'

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: KeyboardShortcut[]
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Allow Escape to blur inputs
        if (event.key === 'Escape') {
          target.blur()
        }
        return
      }

      // Handle help modal toggle
      if (event.key === '?') {
        event.preventDefault()
        setShowHelp((prev) => !prev)
        return
      }

      // Handle Escape
      if (event.key === 'Escape') {
        event.preventDefault()
        setShowHelp(false)
        return
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey
        const altMatch = s.alt ? event.altKey : !event.altKey
        return keyMatch && ctrlMatch && shiftMatch && altMatch
      })

      if (shortcut) {
        event.preventDefault()
        shortcut.action()
      }
    },
    [enabled, shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    showHelp,
    setShowHelp,
    shortcuts
  }
}

// Hook for article list navigation
interface UseArticleNavigationOptions {
  articles: Array<{ id: number }>
  selectedIndex: number
  onSelect: (index: number) => void
  onOpen: (articleId: number) => void
  onToggleRead: (articleId: number) => void
  onSave: (articleId: number) => void
  enabled?: boolean
}

export function useArticleNavigation({
  articles,
  selectedIndex,
  onSelect,
  onOpen,
  onToggleRead,
  onSave,
  enabled = true
}: UseArticleNavigationOptions) {
  const [showHelp, setShowHelp] = useState(false)

  const navigate = useCallback(
    (direction: 'next' | 'prev') => {
      if (articles.length === 0) return

      if (direction === 'next') {
        const newIndex = Math.min(selectedIndex + 1, articles.length - 1)
        onSelect(newIndex)
      } else {
        const newIndex = Math.max(selectedIndex - 1, 0)
        onSelect(newIndex)
      }
    },
    [articles.length, selectedIndex, onSelect]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        if (event.key === 'Escape') {
          target.blur()
        }
        return
      }

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          navigate('next')
          break
        case 'ArrowDown':
          event.preventDefault()
          navigate('next')
          break
        case 'ArrowLeft':
          event.preventDefault()
          navigate('prev')
          break
        case 'ArrowUp':
          event.preventDefault()
          navigate('prev')
          break
        case 'Enter':
          event.preventDefault()
          if (articles[selectedIndex]) {
            onOpen(articles[selectedIndex].id)
          }
          break
        case ' ':
          event.preventDefault()
          if (articles[selectedIndex]) {
            onToggleRead(articles[selectedIndex].id)
          }
          break
        case 's':
        case 'S':
          event.preventDefault()
          if (articles[selectedIndex]) {
            onSave(articles[selectedIndex].id)
          }
          break
        case '?':
          event.preventDefault()
          setShowHelp((prev) => !prev)
          break
        case 'Escape':
          event.preventDefault()
          setShowHelp(false)
          break
      }
    },
    [enabled, articles, selectedIndex, navigate, onOpen, onToggleRead, onSave]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected article into view
  useEffect(() => {
    if (articles.length > 0 && selectedIndex >= 0) {
      const element = document.querySelector(`[data-article-index="${selectedIndex}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedIndex, articles.length])

  return {
    showHelp,
    setShowHelp,
    selectedIndex,
    shortcuts: [
      { key: '→/↓', description: 'Next article' },
      { key: '←/↑', description: 'Previous article' },
      { key: 'Enter', description: 'Open article' },
      { key: 'Space', description: 'Toggle read/unread' },
      { key: 's', description: 'Save for later' },
      { key: '?', description: 'Show shortcuts' },
      { key: 'Esc', description: 'Close modal' }
    ]
  }
}
