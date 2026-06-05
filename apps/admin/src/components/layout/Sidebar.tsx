'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Globe, Users, MapPin, Building2, BarChart3, LogOut, LayoutDashboard, ListChecks, CalendarDays,
} from 'lucide-react'

const NAV = [
  { href: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/countries',  label: 'Countries',  icon: MapPin },
  { href: '/listings',   label: 'Listings',   icon: ListChecks },
  { href: '/bookings',   label: 'Bookings',   icon: CalendarDays },
  { href: '/providers',  label: 'Providers',  icon: Building2 },
  { href: '/users',      label: 'Users',      icon: Users },
  { href: '/revenue',    label: 'Revenue',    icon: BarChart3 },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-gray-900 text-gray-300 min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-800">
        <Globe className="w-5 h-5 text-brand-400" />
        <span className="font-bold text-white text-lg">Orbya Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-brand-700 text-white' : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
