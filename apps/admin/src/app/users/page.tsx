import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { Users } from 'lucide-react'
import { UsersTable } from './UsersTable'

export default async function UsersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    take: 500,
    select: {
      id:             true,
      name:           true,
      email:          true,
      role:           true,
      email_verified: true,
      created_at:     true,
      _count:         { select: { bookings: true } },
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <Users className="w-6 h-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} registered user{users.length !== 1 ? 's' : ''} · change role via the dropdown</p>
        </div>
      </div>

      <UsersTable users={users as any} />
    </div>
  )
}
