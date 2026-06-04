'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAuthRoute) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
