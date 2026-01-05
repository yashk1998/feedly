import { Link } from 'react-router-dom'
import { Github, Twitter } from 'lucide-react'

// Logo component
function RivsyLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="8" className="fill-coral-500" />
      <path
        d="M10 8h8c2.5 0 4.5 2 4.5 4.5 0 2-1.3 3.7-3.2 4.3L22 24h-4l-2.5-6H14v6h-4V8zm4 3.5v4h3.5c1.1 0 2-.9 2-2s-.9-2-2-2H14z"
        fill="white"
      />
      <circle cx="24" cy="8" r="3" fill="white" fillOpacity="0.9" />
    </svg>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const productLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#pricing', label: 'Pricing' },
  ]

  const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ]

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-paper-50 dark:bg-midnight-950">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group mb-4">
              <RivsyLogo className="w-8 h-8" />
              <span className="font-display text-xl text-ink-900 dark:text-white">rivsy</span>
            </Link>
            <p className="text-ink-600 dark:text-neutral-400 text-sm leading-relaxed max-w-sm mb-6">
              A modern RSS reader that helps you stay informed without the information overload.
              Subscribe to feeds, organize by topic, and let AI summarize for you.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/rivsy"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-ink-400 hover:text-ink-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/rivsy"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-ink-400 hover:text-ink-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-ink-900 dark:text-white text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-600 dark:text-neutral-400 hover:text-ink-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="font-semibold text-ink-900 dark:text-white text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-ink-600 dark:text-neutral-400 hover:text-ink-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-500 dark:text-neutral-500">
            &copy; {currentYear} rivsy. All rights reserved.
          </p>
          <p className="text-sm text-ink-400 dark:text-neutral-600">
            Made with care for readers everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
