import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { EmployeeShell } from '@/components/layout/EmployeeShell'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Orbya Travels — Staff Portal',
  description: 'Employee tools for Orbya Travels.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let pendingProviders = 0
  let pendingListings  = 0
  try {
    const session = await auth()
    if (session?.user?.role === 'EMPLOYEE' || session?.user?.role === 'ADMIN') {
      ;[pendingProviders, pendingListings] = await Promise.all([
        prisma.providerProfile.count({ where: { verification_status: 'PENDING' } }),
        prisma.listing.count({ where: { approval_status: 'PENDING' } }),
      ])
    }
  } catch { /* ignore on auth pages */ }

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <EmployeeShell pendingProviders={pendingProviders} pendingListings={pendingListings}>
          {children}
        </EmployeeShell>
      </body>
    </html>
  )
}
