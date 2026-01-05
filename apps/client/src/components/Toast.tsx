import { useEffect, useState } from 'react'
import { Toaster, Toast, toast, resolveValue } from 'react-hot-toast'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  X,
  Sparkles,
  Bookmark,
  Copy,
  Trash2
} from 'lucide-react'

// Custom icon mapping based on toast type or custom icon
function ToastIcon({ type, icon }: { type: string; icon?: string }) {
  const iconClass = "w-5 h-5 flex-shrink-0"

  // Custom icons for specific actions
  if (icon === 'sparkles') return <Sparkles className={`${iconClass} text-amber-500`} />
  if (icon === 'bookmark') return <Bookmark className={`${iconClass} text-coral-500 fill-current`} />
  if (icon === 'copy') return <Copy className={`${iconClass} text-blue-500`} />
  if (icon === 'trash') return <Trash2 className={`${iconClass} text-red-500`} />

  switch (type) {
    case 'success':
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
          <CheckCircle2 className={`${iconClass} text-emerald-500 relative`} />
        </div>
      )
    case 'error':
      return <XCircle className={`${iconClass} text-red-500`} />
    case 'loading':
      return <Loader2 className={`${iconClass} text-coral-500 animate-spin`} />
    default:
      return <Info className={`${iconClass} text-blue-500`} />
  }
}

// Progress bar component
function ProgressBar({ duration, paused }: { duration: number; paused: boolean }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (paused) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 10)

    return () => clearInterval(interval)
  }, [duration, paused])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-b-xl overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-coral-500 to-orange-500 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// Individual toast component
function CustomToast({ t, icon }: { t: Toast; icon?: string }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`
        relative max-w-sm w-full pointer-events-auto
        bg-white dark:bg-neutral-900
        border border-neutral-200 dark:border-neutral-800
        rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30
        overflow-hidden
        transition-all duration-300 ease-out
        ${t.visible
          ? 'animate-toast-enter'
          : 'animate-toast-leave'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <ToastIcon type={t.type || 'blank'} icon={icon} />

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-medium text-ink-900 dark:text-white leading-snug">
            {resolveValue(t.message, t)}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`
            p-1 rounded-lg text-ink-400 dark:text-neutral-500
            hover:text-ink-600 dark:hover:text-neutral-300
            hover:bg-neutral-100 dark:hover:bg-neutral-800
            transition-all duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for non-loading toasts */}
      {t.type !== 'loading' && t.duration && (
        <ProgressBar duration={t.duration} paused={isHovered} />
      )}
    </div>
  )
}

// Main Toaster component with custom styling
export default function CustomToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={12}
      containerStyle={{
        bottom: 24,
        right: 24,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    >
      {(t) => <CustomToast t={t} />}
    </Toaster>
  )
}

// Custom toast functions with enhanced styling
export const customToast = {
  success: (message: string) => {
    return toast.success(message, {
      duration: 3000,
    })
  },

  error: (message: string) => {
    return toast.error(message, {
      duration: 5000,
    })
  },

  loading: (message: string) => {
    return toast.loading(message)
  },

  info: (message: string) => {
    return toast(message, {
      duration: 4000,
    })
  },

  // Special toasts for specific actions
  saved: (message: string = 'Saved for later') => {
    return toast.success(message, {
      duration: 2500,
      icon: '🔖',
    })
  },

  copied: (message: string = 'Copied to clipboard') => {
    return toast.success(message, {
      duration: 2000,
      icon: '📋',
    })
  },

  deleted: (message: string = 'Successfully deleted') => {
    return toast.success(message, {
      duration: 2500,
      icon: '🗑️',
    })
  },

  aiGenerated: (message: string = 'AI content generated') => {
    return toast.success(message, {
      duration: 3000,
      icon: '✨',
    })
  },

  // Promise toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: any) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss()
  },
}
