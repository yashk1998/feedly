import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-parchment-300 dark:border-ink-700 bg-parchment-100 dark:bg-night-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="font-display text-xl text-ink-800 dark:text-ink-50">Syncd</span>
            </Link>
            <p className="text-ink-500 dark:text-ink-400 text-sm leading-relaxed max-w-sm mb-6">
              A modern RSS reader that helps you stay informed without the information overload.
              Subscribe to feeds, organize by topic, and let AI summarize for you.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/syncd"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300 hover:bg-parchment-200 dark:hover:bg-ink-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/syncd"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300 hover:bg-parchment-200 dark:hover:bg-ink-700 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-ink-800 dark:text-ink-50 text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-50 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-50 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-ink-800 dark:text-ink-50 text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-50 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-50 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-parchment-300 dark:border-ink-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-500 dark:text-ink-500">
            &copy; {currentYear} Syncd. All rights reserved.
          </p>
          <p className="text-sm text-ink-400 dark:text-ink-600">
            Made with care for readers everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
