import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ProviderShell } from '@/components/layout/ProviderShell'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Orbya — Provider Portal',
  description: 'Manage your listings, bookings and payouts on Orbya.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <ProviderShell>{children}</ProviderShell>
      </body>
    </html>
  )
}
