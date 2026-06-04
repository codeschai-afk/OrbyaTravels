import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AdminShell } from '@/components/layout/AdminShell'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Orbya Admin',
  description: 'Admin control panel for Orbya Travels.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
