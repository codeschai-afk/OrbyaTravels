import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ProviderShell } from '@/components/layout/ProviderShell'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Orbya — Provider Portal',
  description: 'Manage your listings, bookings and payouts on Orbya.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let pendingListings = 0
  let newBookings     = 0
  try {
    const session = await auth()
    if (session?.user?.role === 'PROVIDER') {
      const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
      if (profile) {
        ;[pendingListings, newBookings] = await Promise.all([
          prisma.listing.count({ where: { provider_id: profile.id, approval_status: { in: ['PENDING', 'REJECTED'] } } }),
          prisma.booking.count({ where: { items: { some: { listing: { provider_id: profile.id } } }, status: 'CONFIRMED' } }),
        ])
      }
    }
  } catch { /* ignore on auth pages */ }

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <ProviderShell pendingListings={pendingListings} newBookings={newBookings}>
          {children}
        </ProviderShell>
      </body>
    </html>
  )
}
