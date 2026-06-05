import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { DollarSign, BookOpen, TrendingUp, Users } from 'lucide-react'

export default async function RevenuePage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const [bookingCounts, bookingsByStatus, recentBookings, topProviders] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.groupBy({ by: ['status'], _count: true }),
    prisma.booking.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
      include: {
        customer: { select: { name: true, email: true } },
        country: { select: { name: true } },
        items: { select: { total_price: true } },
      },
    }),
    prisma.providerProfile.findMany({
      include: {
        _count: { select: { listings: true } },
      },
      orderBy: { created_at: 'asc' },
      take: 10,
    }),
  ])

  const totalRevenue = recentBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
  const statusMap = Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count]))

  const stats = [
    { label: 'Total bookings', value: bookingCounts, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Confirmed', value: statusMap['CONFIRMED'] ?? 0, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Recent revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
    { label: 'Active providers', value: topProviders.length, icon: Users, color: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <p className="text-gray-500 text-sm mt-1">Booking and payment overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
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
        {/* Booking status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Bookings by status</h2>
          <div className="space-y-3">
            {Object.entries(statusMap).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(statusMap).length === 0 && (
              <p className="text-sm text-gray-400">No bookings yet</p>
            )}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent bookings</h2>
          <div className="space-y-3">
            {recentBookings.slice(0, 8).map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{b.customer.name ?? b.customer.email}</div>
                  <div className="text-xs text-gray-400">{b.country.name} · {new Date(b.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {b.currency} {Number(b.total_amount).toLocaleString()}
                </div>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <p className="text-sm text-gray-400">No bookings yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
