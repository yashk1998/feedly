import { useState, useRef, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import {
  User,
  Settings,
  LogOut,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function ProfileDropdown() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  if (!user) return null

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      href: '/settings',
      description: 'Manage your account'
    },
    {
      icon: CreditCard,
      label: 'Billing',
      href: '/settings?tab=billing',
      description: 'Plans & payments'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      description: 'Preferences'
    },
  ]

  return (
    <div ref={dropdownRef} className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative">
          <img
            src={user.imageUrl}
            alt={user.fullName || 'Profile'}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-coral-500/30 transition-all duration-300 group-hover:scale-105"
          />
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-midnight-950 rounded-full" />
        </div>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-3 w-72 origin-top-right transition-all duration-200 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-4 bg-gradient-to-br from-coral-50 to-orange-50 dark:from-coral-950/30 dark:to-orange-950/20 border-b border-neutral-200/50 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={user.imageUrl}
                alt={user.fullName || 'Profile'}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-neutral-800 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-900 dark:text-white truncate">
                  {user.fullName || 'User'}
                </p>
                <p className="text-sm text-ink-600 dark:text-neutral-300 truncate" title={user.primaryEmailAddress?.emailAddress}>
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>

            {/* Pro Badge or Upgrade CTA */}
            <div className="mt-3">
              <Link
                to="/settings?tab=billing"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 rounded-xl text-sm group hover:bg-white dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-coral-500" />
                  <span className="font-medium text-ink-700 dark:text-neutral-200">Free Plan</span>
                </div>
                <span className="text-xs text-coral-600 dark:text-coral-400 font-medium group-hover:underline">
                  Upgrade
                </span>
              </Link>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-ink-500 dark:text-neutral-400 group-hover:bg-coral-50 group-hover:text-coral-600 dark:group-hover:bg-coral-500/10 dark:group-hover:text-coral-400 transition-colors">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-800 dark:text-neutral-200">
                    {item.label}
                  </p>
                  <p className="text-xs text-ink-400 dark:text-neutral-500">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-300 dark:text-neutral-600 group-hover:text-ink-400 dark:group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-200 dark:border-neutral-800" />

          {/* Help & Sign Out */}
          <div className="py-2">
            <a
              href="https://github.com/anthropics/claude-code/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-ink-500 dark:text-neutral-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-ink-800 dark:text-neutral-200">
                Help & Support
              </span>
            </a>

            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-ink-500 dark:text-neutral-400 group-hover:bg-red-100 group-hover:text-red-600 dark:group-hover:bg-red-500/20 dark:group-hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-ink-800 dark:text-neutral-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
