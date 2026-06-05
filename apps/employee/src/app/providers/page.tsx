import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { ProvidersTable } from './ProvidersTable'
import { Users } from 'lucide-react'

export default async function EmployeeProvidersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') redirect('/auth/signin')

  const profiles = await prisma.providerProfile.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      user:   { select: { name: true, email: true } },
      photos: { orderBy: { sort_order: 'asc' }, take: 1 },
    },
  })

  const pending  = profiles.filter(p => p.verification_status === 'PENDING')
  const approved = profiles.filter(p => p.verification_status === 'APPROVED')
  const rejected = profiles.filter(p => p.verification_status === 'REJECTED')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Provider Applications</h1>
        <p className="text-gray-500 text-sm mt-1">Review and verify provider profiles</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending review', count: pending.length,  color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Approved',       count: approved.length, color: 'text-emerald-600',bg: 'bg-emerald-50' },
          { label: 'Rejected',       count: rejected.length, color: 'text-red-600',    bg: 'bg-red-50' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5`}>
            <div className={`text-3xl font-bold ${color}`}>{count}</div>
            <div className="text-sm text-gray-600 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No provider applications yet</p>
        </div>
      ) : (
        <ProvidersTable profiles={profiles as any} />
      )}
    </div>
  )
}
