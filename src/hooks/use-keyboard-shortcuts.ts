'use client'

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

      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        if (event.key === 'Escape') target.blur()
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        setShowHelp((prev) => !prev)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setShowHelp(false)
        return
      }

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

  return { showHelp, setShowHelp, shortcuts }
}

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
  enabled = true,
}: UseArticleNavigationOptions) {
  const [showHelp, setShowHelp] = useState(false)

  const navigate = useCallback(
    (direction: 'next' | 'prev') => {
      if (articles.length === 0) return

      if (direction === 'next') {
        onSelect(Math.min(selectedIndex + 1, articles.length - 1))
      } else {
        onSelect(Math.max(selectedIndex - 1, 0))
      }
    },
    [articles.length, selectedIndex, onSelect]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        if (event.key === 'Escape') target.blur()
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'j':
          event.preventDefault()
          navigate('next')
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'k':
          event.preventDefault()
          navigate('prev')
          break
        case 'Enter':
        case 'o':
          event.preventDefault()
          if (articles[selectedIndex]) onOpen(articles[selectedIndex].id)
          break
        case ' ':
        case 'm':
          event.preventDefault()
          if (articles[selectedIndex]) onToggleRead(articles[selectedIndex].id)
          break
        case 's':
        case 'S':
          event.preventDefault()
          if (articles[selectedIndex]) onSave(articles[selectedIndex].id)
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
      { key: 'j/↓', description: 'Next article' },
      { key: 'k/↑', description: 'Previous article' },
      { key: 'o/Enter', description: 'Open article' },
      { key: 'm/Space', description: 'Toggle read/unread' },
      { key: 's', description: 'Save for later' },
      { key: '?', description: 'Show shortcuts' },
      { key: 'Esc', description: 'Close modal' },
    ],
  }
}
