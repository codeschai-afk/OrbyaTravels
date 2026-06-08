'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown, User, CalendarDays, LogOut, Loader2 } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('[data-user-menu]')) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const textClass = scrolled ? 'text-gray-700' : 'text-white'

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const displayName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'My account'

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/logo.png"
              alt="Orbya Travel"
              className={`h-9 w-auto transition-all duration-300 ${scrolled ? 'brightness-0' : ''}`}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/trips" className={`text-sm font-medium hover:opacity-75 transition-opacity ${textClass}`}>
              Destinations
            </Link>
            <Link href="/plan" className={`text-sm font-medium hover:opacity-75 transition-opacity ${textClass}`}>
              Plan a trip
            </Link>
            <Link href="/#how-it-works" className={`text-sm font-medium hover:opacity-75 transition-opacity ${textClass}`}>
              How it works
            </Link>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'loading' ? (
              <Loader2 className={`w-4 h-4 animate-spin ${textClass}`} />
            ) : session ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-black/10 transition-colors ${textClass}`}
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    {displayName[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="w-4 h-4 text-gray-400" />
                      My profile
                    </Link>
                    <Link href="/bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      My bookings
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className={`text-sm font-medium px-4 py-2 rounded-lg hover:opacity-75 transition-opacity ${textClass}`}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`md:hidden p-2 rounded-lg ${textClass}`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <Link href="/trips" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
            Destinations
          </Link>
          <Link href="/plan" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
            Plan a trip
          </Link>
          <Link href="/#how-it-works" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
            How it works
          </Link>
          <hr className="border-gray-100" />
          {session ? (
            <>
              <div className="py-2">
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 truncate">{session.user?.email}</p>
              </div>
              <Link href="/profile" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
                My profile
              </Link>
              <Link href="/bookings" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
                My bookings
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left text-sm font-medium text-red-600 py-2"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="block text-sm font-medium text-center px-4 py-2 rounded-lg bg-brand-600 text-white"
                onClick={() => setMenuOpen(false)}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
