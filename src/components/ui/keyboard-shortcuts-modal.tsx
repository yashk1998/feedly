'use client'

import { X } from 'lucide-react'

interface ShortcutInfo {
  key: string
  description: string
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: ShortcutInfo[]
}

export default function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-night-800 rounded-2xl border border-parchment-300 dark:border-ink-700 shadow-elevated w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl text-ink-800 dark:text-ink-50">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-parchment-200 dark:hover:bg-ink-700 text-ink-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-ink-600 dark:text-ink-300">{shortcut.description}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-parchment-200 dark:bg-ink-700 text-xs font-mono text-ink-700 dark:text-ink-300 border border-parchment-300 dark:border-ink-600">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
