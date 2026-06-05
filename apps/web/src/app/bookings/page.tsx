import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { CalendarDays, MapPin, Package } from 'lucide-react'

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
  return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function fmtStatus(s: string) {
  return s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

export default async function BookingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/bookings')

  const bookings = await prisma.booking.findMany({
    where: { customer_id: session.user.id },
    include: {
      country: { select: { name: true, slug: true } },
      items:   { include: { listing: { select: { title: true, slug: true, type: true } } } },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No bookings yet</p>
            <p className="text-gray-400 text-sm mt-1">Once you book a trip, it will appear here</p>
            <Link href="/trips"
              className="mt-6 inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors">
              Explore destinations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{booking.country.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Booking #{booking.id.slice(-8).toUpperCase()} ·{' '}
                      {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {fmtStatus(booking.status)}
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{fmt(booking.total_amount)}</p>
                  </div>
                </div>

                {booking.items.length > 0 && (
                  <div className="border-t border-gray-50 pt-3 space-y-1.5">
                    {booking.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="truncate">{item.listing.title}</span>
                        <span className="shrink-0 text-gray-400">·</span>
                        <span className="shrink-0 font-medium">{fmt(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
