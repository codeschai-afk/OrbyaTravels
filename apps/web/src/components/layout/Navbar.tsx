'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Globe } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const textClass = scrolled ? 'text-gray-700' : 'text-white'
  const logoClass = scrolled ? 'text-brand-600' : 'text-white'

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className={`flex items-center gap-2 font-bold text-xl ${logoClass}`}>
            <Globe className="w-6 h-6" />
            Orbya
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#destinations" className={`text-sm font-medium hover:opacity-75 transition-opacity ${textClass}`}>
              Destinations
            </Link>
            <Link href="/#how-it-works" className={`text-sm font-medium hover:opacity-75 transition-opacity ${textClass}`}>
              How it works
            </Link>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
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
          <Link href="/#destinations" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
            Destinations
          </Link>
          <Link href="/#how-it-works" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
            How it works
          </Link>
          <hr className="border-gray-100" />
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
        </div>
      )}
    </nav>
  )
}
