import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/clerk-react'
import { Menu, X, Sun, Moon, ChevronRight } from 'lucide-react'

// Custom Logo Component - Stylized "R" mark
function RivsyLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-coral-500" />
      <path
        d="M10 8h8c2.5 0 4.5 2 4.5 4.5 0 2-1.3 3.7-3.2 4.3L22 24h-4l-2.5-6H14v6h-4V8zm4 3.5v4h3.5c1.1 0 2-.9 2-2s-.9-2-2-2H14z"
        fill="white"
      />
      <circle cx="24" cy="8" r="3" fill="white" fillOpacity="0.9" />
    </svg>
  )
}

export default function Navbar() {
  const { isSignedIn } = useAuth()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
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

  const isLandingPage = location.pathname === '/'

  // Navigation links for authenticated users
  const authNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/feeds', label: 'Feeds' },
    { href: '/saved', label: 'Saved' },
  ]

  // Navigation links for landing page (non-authenticated)
  const publicNavLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#pricing', label: 'Pricing' },
  ]

  const navLinks = isSignedIn ? authNavLinks : publicNavLinks

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled || !isLandingPage
          ? 'bg-white/90 dark:bg-midnight-950/90 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800/80'
          : 'bg-paper-50 dark:bg-midnight-950'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link
            to={isSignedIn ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <RivsyLogo className="w-8 h-8 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]" />
            <span className="font-display text-xl text-ink-900 dark:text-white tracking-tight">
              rivsy
            </span>
          </Link>

          {/* Center Navigation - Absolutely centered */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg group ${
                  location.pathname === link.href
                    ? 'text-coral-600 dark:text-coral-400'
                    : 'text-ink-600 hover:text-ink-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-1 left-4 right-4 h-0.5 bg-coral-500 rounded-full transition-transform duration-200 origin-left ${
                  location.pathname === link.href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
            ))}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative p-2 rounded-xl text-ink-500 hover:text-ink-900 dark:text-neutral-500 dark:hover:text-white transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5">
                <Sun className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
                <Moon className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
              </div>
            </button>

            {isSignedIn ? (
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 rounded-xl ring-2 ring-transparent hover:ring-coral-500/20 transition-all duration-200',
                  },
                }}
              />
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {/* Sign in - Subtle text link */}
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                    Sign in
                  </button>
                </SignInButton>

                {/* Get Started - Primary CTA */}
                <SignUpButton mode="modal">
                  <button className="group relative px-5 py-2.5 text-sm font-semibold text-white bg-coral-500 rounded-xl overflow-hidden transition-all duration-300 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-500/25 hover:-translate-y-0.5 active:translate-y-0">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center gap-1">
                      Get started free
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </SignUpButton>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5">
                <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
                <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-midnight-950">
            <div className="flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.href
                      ? 'bg-coral-50 text-coral-600 dark:bg-coral-500/10 dark:text-coral-400'
                      : 'text-ink-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {link.label}
                </Link>
              ))}

              {!isSignedIn && (
                <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-800 px-4">
                  <SignInButton mode="modal">
                    <button className="w-full py-3 text-sm font-medium text-ink-700 dark:text-neutral-300 hover:text-ink-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full py-3 text-sm font-semibold text-white bg-coral-500 hover:bg-coral-600 rounded-xl transition-all duration-200 flex items-center justify-center gap-1">
                      Get started free
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
