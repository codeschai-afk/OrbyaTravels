'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Hotel, Car, Bus, Plane, Train, List,
  BarChart3, CreditCard, UserCircle, LogOut, Globe,
} from 'lucide-react'

const NAV = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/listings',  label: 'All listings', icon: List },
  { divider: true },
  { href: '/hotels',    label: 'Hotels',     icon: Hotel },
  { href: '/cars',      label: 'Car rentals', icon: Car },
  { href: '/buses',     label: 'Buses',      icon: Bus },
  { href: '/flights',   label: 'Flights',    icon: Plane },
  { href: '/trains',    label: 'Trains',     icon: Train },
  { divider: true },
  { href: '/analytics', label: 'Analytics',  icon: BarChart3 },
  { href: '/payouts',   label: 'Payouts',    icon: CreditCard },
  { href: '/profile',   label: 'Profile',    icon: UserCircle },
]

export function ProviderSidebar() {
  const path = usePathname()

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
          const { href, label, icon: Icon } = item
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
              <Icon className="w-4 h-4 shrink-0" />
              {label}
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
