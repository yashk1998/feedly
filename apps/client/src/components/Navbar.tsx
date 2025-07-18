import { Link, useLocation } from 'react-router-dom'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/clerk-react'
import { Rss, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { isSignedIn } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Feeds', href: '/feeds' },
    { name: 'Settings', href: '/settings' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Rss className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Growero</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isSignedIn ? (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link
                  to="/pricing"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Pricing
                </Link>
                <SignInButton mode="modal">
                  <button className="btn btn-outline">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary">Get Started</button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isSignedIn ? (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === item.href
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="px-3 py-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/pricing"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <div className="px-3 py-2 space-y-2">
                  <SignInButton mode="modal">
                    <button className="btn btn-outline w-full">Sign In</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="btn btn-primary w-full">Get Started</button>
                  </SignUpButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 