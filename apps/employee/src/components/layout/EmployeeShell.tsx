'use client'

import { usePathname } from 'next/navigation'
import { EmployeeSidebar } from './EmployeeSidebar'

interface Props {
  children:         React.ReactNode
  pendingProviders: number
  pendingListings:  number
}

export function EmployeeShell({ children, pendingProviders, pendingListings }: Props) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAuthRoute) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      <EmployeeSidebar pendingProviders={pendingProviders} pendingListings={pendingListings} />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}
