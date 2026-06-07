'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, ListChecks, AlertTriangle, Globe, LogOut, Users, MapPin } from 'lucide-react'

interface Props {
  pendingProviders: number
  pendingListings:  number
}

export function EmployeeSidebar({ pendingProviders, pendingListings }: Props) {
  const path = usePathname()

  const NAV = [
    { href: '/',          label: 'Dashboard', icon: LayoutDashboard, dot: false },
    { href: '/queue',     label: 'Queue',     icon: ListChecks,      dot: pendingListings  > 0 },
    { href: '/providers', label: 'Providers', icon: Users,           dot: pendingProviders > 0 },
    { href: '/places',    label: 'Places',    icon: MapPin,          dot: false },
    { href: '/disputes',  label: 'Disputes',  icon: AlertTriangle,   dot: false },
  ]

  return (
    <aside className="w-60 shrink-0 bg-gray-900 text-gray-300 min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-800">
        <Globe className="w-5 h-5 text-blue-400" />
        <span className="font-bold text-white text-lg">Orbya Staff</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, dot }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-700 text-white' : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {dot && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-gray-900" />
                )}
              </div>
              {label}
              {dot && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
              )}
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
