'use client'

import { usePathname } from 'next/navigation'
import { EmployeeSidebar } from './EmployeeSidebar'

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAuthRoute) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}
