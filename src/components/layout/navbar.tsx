'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Menu, X, Sun, Moon, ChevronRight, LogOut, Settings, Search, Command } from 'lucide-react'

function SyncdLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" className="fill-sage-600" />
      <path
        d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  )
}

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  const isLandingPage = pathname === '/'

  const authNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/feeds', label: 'Feeds' },
    { href: '/saved', label: 'Saved' },
    { href: '/digest', label: 'Digest' },
  ]

  const publicNavLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#pricing', label: 'Pricing' },
  ]

  const navLinks = session ? authNavLinks : publicNavLinks

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled || !isLandingPage
          ? 'bg-white/90 dark:bg-night-900/90 backdrop-blur-2xl border-b border-parchment-300/80 dark:border-ink-700/80'
          : 'bg-parchment-100 dark:bg-night-900'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={session ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <SyncdLogo className="w-8 h-8 transition-transform duration-300 group-hover:scale-105" />
            <span className="font-display text-xl text-ink-800 dark:text-ink-50 tracking-tight">
              Syncd
            </span>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg group ${
                  pathname === link.href
                    ? 'text-sage-700 dark:text-sage-400'
                    : 'text-ink-600 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-50'
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-1 left-4 right-4 h-0.5 bg-sage-600 rounded-full transition-transform duration-200 origin-left ${
                    pathname === link.href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Cmd+K trigger */}
            {session && (
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-ink-400 dark:text-ink-500 bg-parchment-200/60 dark:bg-ink-700/40 rounded-lg hover:bg-parchment-200 dark:hover:bg-ink-700 transition-colors border border-parchment-300/50 dark:border-ink-600/50"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">Search</span>
                <kbd className="text-xs px-1 py-0.5 rounded bg-parchment-300/80 dark:bg-ink-600/80 font-mono flex items-center gap-0.5 ml-1">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>
            )}
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative p-2 rounded-xl text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-50 transition-all duration-200 hover:bg-parchment-200 dark:hover:bg-ink-700"
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5">
                <Sun
                  className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                    isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
                  }`}
                />
                <Moon
                  className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                    isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
              </div>
            </button>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-parchment-200 dark:hover:bg-ink-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-sage-600 flex items-center justify-center text-white text-sm font-medium">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-white dark:bg-night-800 rounded-xl border border-parchment-300 dark:border-ink-700 shadow-elevated z-50 py-2">
                      <div className="px-4 py-2 border-b border-parchment-300 dark:border-ink-700">
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-50 truncate">
                          {session.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-ink-500 truncate">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-600 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-ink-700"
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-600 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-ink-700 w-full"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => signIn()}
                  className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-50 transition-colors"
                >
                  Sign in
                </button>
                <Link
                  href="/sign-up"
                  className="group relative px-5 py-2.5 text-sm font-semibold text-white bg-sage-600 rounded-xl overflow-hidden transition-all duration-300 hover:bg-sage-700 hover:shadow-lg hover:shadow-sage-500/25 hover:-translate-y-0.5"
                >
                  <span className="relative flex items-center gap-1">
                    Get started free
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-ink-600 hover:text-ink-800 hover:bg-parchment-200 dark:text-ink-400 dark:hover:text-ink-50 dark:hover:bg-ink-700 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5">
                <X
                  className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                    isMobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
                  }`}
                />
                <Menu
                  className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                    isMobileMenuOpen ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-parchment-300 dark:border-ink-700">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-400'
                      : 'text-ink-700 hover:bg-parchment-200 dark:text-ink-300 dark:hover:bg-ink-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!session && (
                <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-parchment-300 dark:border-ink-700 px-4">
                  <button
                    onClick={() => signIn()}
                    className="w-full py-3 text-sm font-medium text-ink-700 dark:text-ink-300 border border-parchment-300 dark:border-ink-600 rounded-xl"
                  >
                    Sign in
                  </button>
                  <Link
                    href="/sign-up"
                    className="w-full py-3 text-sm font-semibold text-white bg-sage-600 hover:bg-sage-700 rounded-xl text-center"
                  >
                    Get started free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
