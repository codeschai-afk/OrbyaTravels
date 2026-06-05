import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { BarChart3, TrendingUp, CheckCircle, Clock } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = {
  ACCOMMODATION: 'Hotels',
  FLIGHT:        'Flights',
  BUS:           'Buses',
  TRAIN:         'Trains',
  CAR_RENTAL:    'Car rentals',
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const [byStatus, byType, recent] = await Promise.all([
    prisma.listing.groupBy({
      by: ['approval_status'],
      where: { provider_id: profile.id },
      _count: true,
    }),
    prisma.listing.groupBy({
      by: ['type'],
      where: { provider_id: profile.id },
      _count: true,
    }),
    prisma.listing.findMany({
      where: { provider_id: profile.id },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { country: { select: { name: true } } },
    }),
  ])

  const total = byStatus.reduce((s, b) => s + b._count, 0)
  const approved = byStatus.find(b => b.approval_status === 'APPROVED')?._count ?? 0
  const pending = byStatus.find(b => b.approval_status === 'PENDING')?._count ?? 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your listings and performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total listings', value: total, icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
          { label: 'Approved', value: approved, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Pending review', value: pending, icon: Clock, color: 'bg-orange-50 text-orange-600' },
          { label: 'Approval rate', value: total > 0 ? `${Math.round((approved / total) * 100)}%` : '—', icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-4`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">By listing type</h2>
          <div className="space-y-3">
            {byType.map(({ type, _count }) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{TYPE_LABEL[type] ?? type}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full"
                      style={{ width: total > 0 ? `${(_count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="font-medium text-gray-900 w-4 text-right">{_count}</span>
                </div>
              </div>
            ))}
            {byType.length === 0 && <p className="text-sm text-gray-400">No listings yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent listings</h2>
          <div className="space-y-3">
            {recent.map((l) => (
              <div key={l.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{l.title}</div>
                  <div className="text-xs text-gray-400">{l.country.name} · {new Date(l.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  l.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  l.approval_status === 'PENDING'  ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>{l.approval_status}</span>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-gray-400">No listings yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
