import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { ListChecks, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function EmployeeDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') redirect('/auth/signin')

  const [pending, approved, rejected, flagged] = await Promise.all([
    prisma.listing.count({ where: { approval_status: 'PENDING' } }),
    prisma.listing.count({ where: { approval_status: 'APPROVED' } }),
    prisma.listing.count({ where: { approval_status: 'REJECTED' } }),
    prisma.listing.count({ where: { approval_status: 'FLAGGED' } }),
  ])

  const stats = [
    { label: 'Pending review', value: pending, icon: Clock, color: 'bg-orange-50 text-orange-600', href: '/queue' },
    { label: 'Approved', value: approved, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', href: '/queue?status=APPROVED' },
    { label: 'Rejected', value: rejected, icon: ListChecks, color: 'bg-red-50 text-red-600', href: '/queue?status=REJECTED' },
    { label: 'Flagged', value: flagged, icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600', href: '/disputes' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {session.user.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-4`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/queue" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="font-semibold text-gray-900 mb-1">Review queue</div>
          <p className="text-sm text-gray-500">
            {pending > 0 ? `${pending} listing${pending !== 1 ? 's' : ''} waiting for review` : 'All caught up — no pending listings'}
          </p>
        </Link>
        <Link href="/disputes" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="font-semibold text-gray-900 mb-1">Flagged listings</div>
          <p className="text-sm text-gray-500">
            {flagged > 0 ? `${flagged} listing${flagged !== 1 ? 's' : ''} flagged for review` : 'No flagged listings'}
          </p>
        </Link>
      </div>
    </div>
  )
}
