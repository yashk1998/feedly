import { X, Keyboard } from 'lucide-react'

interface ShortcutItem {
  key: string
  description: string
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: ShortcutItem[]
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md mx-4 p-0 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200 dark:border-ink-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="font-display text-xl text-ink-900 dark:text-paper-50">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon-sm"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <span className="text-ink-600 dark:text-paper-300">
                  {shortcut.description}
                </span>
                <kbd className="px-3 py-1.5 rounded-lg bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 font-mono text-sm text-ink-700 dark:text-paper-200 min-w-[48px] text-center">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-paper-50 dark:bg-ink-800/50 border-t border-paper-200 dark:border-ink-700">
          <p className="text-xs text-ink-400 dark:text-paper-500 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-paper-200 dark:bg-ink-700 font-mono text-xs">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  )
}
