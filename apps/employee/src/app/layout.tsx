import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { EmployeeShell } from '@/components/layout/EmployeeShell'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Orbya Travels — Staff Portal',
  description: 'Employee tools for Orbya Travels.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <EmployeeShell>{children}</EmployeeShell>
      </body>
    </html>
  )
}
