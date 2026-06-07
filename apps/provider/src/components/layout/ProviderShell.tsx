'use client'

import { usePathname } from 'next/navigation'
import { ProviderSidebar } from './ProviderSidebar'

interface Props {
  children:       React.ReactNode
  pendingListings: number
  newBookings:     number
}

export function ProviderShell({ children, pendingListings, newBookings }: Props) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAuthRoute) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ProviderSidebar pendingListings={pendingListings} newBookings={newBookings} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
