import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { ArrowLeft, MapPin, Package, Clock, CalendarDays } from 'lucide-react'

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

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/bookings')

  const booking = await prisma.booking.findUnique({
    where: { id: params.id, customer_id: session.user.id },
    include: {
      country:        { select: { name: true, slug: true } },
      items: {
        include: {
          listing:   { select: { title: true, slug: true, type: true } },
          room_type: { select: { name: true } },
        },
      },
      status_history: { orderBy: { created_at: 'asc' } },
    },
  })
  if (!booking) notFound()

  const createdAt = new Date(booking.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link href="/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All bookings
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.id.slice(-8).toUpperCase()}</h1>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLE[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-4">
          <div className="flex items-center gap-3 px-6 py-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Destination</p>
              <Link href={`/trips/${booking.country.slug}`} className="font-semibold text-gray-900 hover:text-brand-600">
                {booking.country.name}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <CalendarDays className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Booked on</p>
              <p className="font-medium text-gray-900 text-sm">{createdAt}</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">{fmt(booking.total_amount)}</span>
          </div>
        </div>

        {/* Items */}
        {booking.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {booking.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <Package className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/listings/${item.listing.slug}`}
                      className="text-sm font-medium text-gray-900 hover:text-brand-600 truncate block">
                      {item.listing.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{item.listing.type.replace('_', ' ')}</p>
                    {item.check_in_date && item.check_out_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.check_in_date).toLocaleDateString()} → {new Date(item.check_out_date).toLocaleDateString()}
                        {item.room_type && <span> · {item.room_type.name}</span>}
                        {item.quantity > 1 && <span> · {item.quantity} guests</span>}
                      </p>
                    )}
                    {item.pickup_date && item.return_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Pickup: {new Date(item.pickup_date).toLocaleDateString()} · Return: {new Date(item.return_date).toLocaleDateString()}
                      </p>
                    )}
                    {item.passenger_count && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.passenger_count} passenger{item.passenger_count !== 1 ? 's' : ''}
                        {item.seat_class && <span> · {item.seat_class}</span>}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 shrink-0">{fmt(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status timeline */}
        {booking.status_history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Status history</h2>
            <div className="space-y-3">
              {booking.status_history.map((event, i) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-brand-400 shrink-0 ring-4 ring-brand-50" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {event.from_status ? `${event.from_status} → ` : ''}{event.to_status}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {event.note && <p className="text-xs text-gray-500 mt-1">{event.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
