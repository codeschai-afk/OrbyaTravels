import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { CalendarDays, Users, MapPin, TrendingUp } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  DRAFT:           'bg-gray-100 text-gray-500',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  CONFIRMED:       'bg-blue-100 text-blue-700',
  IN_PROGRESS:     'bg-purple-100 text-purple-700',
  COMPLETED:       'bg-emerald-100 text-emerald-700',
  CANCELLED:       'bg-red-100 text-red-600',
  REFUNDED:        'bg-gray-100 text-gray-500',
}

function fmtStatus(s: string) {
  return s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function fmt(price: unknown) {
  return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default async function AdminBookingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const [bookings, totalRevenue, byStatus] = await Promise.all([
    prisma.booking.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        country:  { select: { name: true } },
        items:    { select: { listing: { select: { title: true, type: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take:    100,
    }),
    prisma.booking.aggregate({
      where:  { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } },
      _sum:   { total_amount: true },
    }),
    prisma.booking.groupBy({
      by:     ['status'],
      _count: { id: true },
    }),
  ])

  const statusCounts = Object.fromEntries(byStatus.map((b) => [b.status, b._count.id]))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">All platform bookings across providers</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total bookings', value: bookings.length, icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
          { label: 'Confirmed',      value: (statusCounts['CONFIRMED'] ?? 0) + (statusCounts['IN_PROGRESS'] ?? 0), icon: Users, color: 'bg-purple-50 text-purple-600' },
          { label: 'Completed',      value: statusCounts['COMPLETED'] ?? 0, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Revenue',        value: fmt(totalRevenue._sum.total_amount ?? 0), icon: TrendingUp, color: 'bg-orange-50 text-orange-600', isText: true },
        ].map(({ label, value, icon: Icon, color, isText }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`inline-flex p-2 rounded-xl ${color} mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className={`font-bold text-gray-900 ${isText ? 'text-xl' : 'text-3xl'}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {fmtStatus(status)}
            <span className="bg-black/10 text-inherit rounded-full px-1.5 py-0.5 font-bold">{count}</span>
          </span>
        ))}
      </div>

      {/* Table */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No bookings yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Destination</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Total</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                    #{booking.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{booking.customer.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{booking.customer.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {booking.country.name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {booking.items.map((i) => i.listing.type.replace('_', ' ')).join(', ')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {fmtStatus(booking.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                    {fmt(booking.total_amount)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-400">
                    {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
