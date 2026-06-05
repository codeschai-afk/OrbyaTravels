import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { CalendarDays, MapPin, Package, Users } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  DRAFT:           'bg-gray-100 text-gray-600',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  CONFIRMED:       'bg-blue-100 text-blue-700',
  IN_PROGRESS:     'bg-purple-100 text-purple-700',
  COMPLETED:       'bg-emerald-100 text-emerald-700',
  CANCELLED:       'bg-red-100 text-red-600',
  REFUNDED:        'bg-gray-100 text-gray-500',
}

function fmt(price: unknown) {
  return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default async function ProviderBookingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const bookings = await prisma.booking.findMany({
    where: { items: { some: { listing: { provider_id: profile.id } } } },
    include: {
      customer: { select: { name: true, email: true } },
      country:  { select: { name: true } },
      items: {
        where:   { listing: { provider_id: profile.id } },
        include: { listing: { select: { title: true, type: true } } },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">Customer bookings for your listings</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No bookings yet</p>
          <p className="text-gray-400 text-sm mt-1">Bookings will appear here once customers reserve your listings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}`}
              className="block bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-900 text-sm">{booking.customer.name ?? booking.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {booking.country.name}
                    <span>·</span>
                    <span>#{booking.id.slice(-8).toUpperCase()}</span>
                    <span>·</span>
                    {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[booking.status] ?? STATUS_STYLE.DRAFT}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{fmt(booking.total_amount)}</p>
                </div>
              </div>
              <div className="border-t border-gray-50 pt-3 space-y-1">
                {booking.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs text-gray-500">
                    <Package className="w-3 h-3 text-gray-300 shrink-0" />
                    {item.listing.title}
                    <span className="text-gray-300">·</span>
                    {item.listing.type.replace('_', ' ')}
                    <span className="text-gray-300">·</span>
                    {fmt(item.total_price)}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
