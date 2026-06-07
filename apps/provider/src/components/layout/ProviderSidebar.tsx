'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Hotel, Car, Bus, Plane, Train, List,
  BarChart3, CreditCard, UserCircle, LogOut, Globe, CalendarDays,
} from 'lucide-react'

interface Props {
  pendingListings: number
  newBookings:     number
}

export function ProviderSidebar({ pendingListings, newBookings }: Props) {
  const path = usePathname()

  const NAV = [
    { href: '/',          label: 'Dashboard',    icon: LayoutDashboard, dot: false },
    { href: '/bookings',  label: 'Bookings',     icon: CalendarDays,    dot: newBookings     > 0 },
    { href: '/listings',  label: 'All listings', icon: List,            dot: pendingListings > 0 },
    { divider: true },
    { href: '/hotels',    label: 'Hotels',       icon: Hotel,           dot: false },
    { href: '/cars',      label: 'Car rentals',  icon: Car,             dot: false },
    { href: '/buses',     label: 'Buses',        icon: Bus,             dot: false },
    { href: '/flights',   label: 'Flights',      icon: Plane,           dot: false },
    { href: '/trains',    label: 'Trains',       icon: Train,           dot: false },
    { divider: true },
    { href: '/analytics', label: 'Analytics',    icon: BarChart3,       dot: false },
    { href: '/payouts',   label: 'Payouts',      icon: CreditCard,      dot: false },
    { href: '/profile',   label: 'Profile',      icon: UserCircle,      dot: false },
  ]

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <Globe className="w-5 h-5 text-brand-600" />
        <span className="font-bold text-gray-900 text-lg">Orbya</span>
        <span className="text-xs text-gray-400 font-medium ml-1">Provider</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item, i) => {
          if ('divider' in item) return <div key={i} className="my-2 border-t border-gray-100" />
          const { href, label, icon: Icon, dot } = item as { href: string; label: string; icon: typeof LayoutDashboard; dot: boolean }
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {dot && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
                )}
              </div>
              {label}
              {dot && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
