'use client'

import { usePathname } from 'next/navigation'
import { ProviderSidebar } from './ProviderSidebar'

export function ProviderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAuthRoute) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ProviderSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
