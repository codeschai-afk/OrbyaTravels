import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { User, Mail, Shield, CalendarDays } from 'lucide-react'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/profile')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, created_at: true },
  })
  if (!user) redirect('/auth/signin')

  const joined = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My profile</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Avatar header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/25 text-white flex items-center justify-center text-2xl font-bold">
              {(user.name ?? user.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold text-xl">{user.name ?? 'Traveller'}</p>
              <p className="text-white/75 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="divide-y divide-gray-50">
            <div className="flex items-center gap-4 px-6 py-4">
              <User className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Full name</p>
                <p className="text-sm font-medium text-gray-900">{user.name ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4">
              <Mail className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Email address</p>
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4">
              <Shield className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Account type</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4">
              <CalendarDays className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Member since</p>
                <p className="text-sm font-medium text-gray-900">{joined}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              To update your name or password, contact support at{' '}
              <a href="mailto:support@orbyatravel.com" className="text-brand-600 hover:underline">support@orbyatravel.com</a>
              {' '}— self-service editing coming soon.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <a href="/bookings" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
            <CalendarDays className="w-4 h-4" />
            View my bookings
          </a>
        </div>
      </div>
    </div>
  )
}
