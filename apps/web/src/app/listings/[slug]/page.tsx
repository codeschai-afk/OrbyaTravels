import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@orbyatravel/db'
import { auth } from '@/lib/auth'
import { Hotel, Car, Bus, Plane, Train, ArrowLeft, Star, Clock, MapPin, CheckCircle, Info } from 'lucide-react'

const TYPE_META: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  ACCOMMODATION: { label: 'Hotel',      icon: Hotel },
  CAR_RENTAL:    { label: 'Car rental', icon: Car },
  BUS:           { label: 'Bus',        icon: Bus },
  FLIGHT:        { label: 'Flight',     icon: Plane },
  TRAIN:         { label: 'Train',      icon: Train },
}

function fmt(price: unknown) {
  return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`
}

export default async function ListingDetailPage({ params }: { params: { slug: string } }) {
  const session = await auth()

  // slug may not be globally unique — try ACCOMMODATION first then any
  const listing = await prisma.listing.findFirst({
    where: { slug: params.slug, approval_status: 'APPROVED', is_active: true },
    include: {
      country:       true,
      provider:      { select: { business_name: true, city: true, description: true } },
      images:        { orderBy: { sort_order: 'asc' } },
      accommodation: { include: { room_types: { take: 5 } } },
      flight:        { include: { schedules: { where: { is_active: true }, take: 5 } } },
      bus:           true,
      train:         true,
      car_rental:    true,
      reviews:       { take: 5, orderBy: { created_at: 'desc' }, include: { user: { select: { name: true } } } },
    },
  })

  if (!listing) notFound()

  const meta = TYPE_META[listing.type] ?? TYPE_META.ACCOMMODATION
  const TypeIcon = meta.icon

  const perUnit = listing.type === 'ACCOMMODATION' ? '/ night'
    : listing.type === 'CAR_RENTAL' ? '/ day'
    : '/ person'

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Back */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href={`/trips/${listing.country.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {listing.country.name}
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          {listing.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.images[0].url} alt={listing.images[0].alt_text ?? listing.title}
                className="w-full h-full object-cover col-span-1 row-span-2" />
              <div className="grid grid-rows-2 gap-2">
                {listing.images.slice(1, 3).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img.url} alt={img.alt_text ?? ''} className="w-full h-full object-cover" />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl h-72 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
              <TypeIcon className="w-20 h-20 text-brand-300" />
            </div>
          )}

          {/* Title + type */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">
                <TypeIcon className="w-3.5 h-3.5" />
                {meta.label}
              </span>
              {listing.accommodation?.stars && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: listing.accommodation.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{listing.title}</h1>
            <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-2">
              <MapPin className="w-4 h-4" />
              {listing.accommodation?.city ?? listing.provider.city ?? listing.provider.business_name}
              {' · '}
              {listing.country.name}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">About this listing</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Accommodation details */}
          {listing.accommodation && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Stay details</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Check-in: {listing.accommodation.check_in_time}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Check-out: {listing.accommodation.check_out_time}
                </div>
                <div className="flex items-start gap-2 text-gray-600 col-span-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  {listing.accommodation.address}, {listing.accommodation.city}
                </div>
              </div>

              {listing.accommodation.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.accommodation.amenities.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {listing.accommodation.room_types.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Room types</p>
                  <div className="space-y-2">
                    {listing.accommodation.room_types.map((rt) => (
                      <div key={rt.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-800">{rt.name}</p>
                          <p className="text-xs text-gray-500">Up to {rt.capacity} guests</p>
                        </div>
                        <p className="font-semibold text-brand-600">{fmt(rt.price_per_night)}<span className="text-xs text-gray-400 font-normal">/night</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flight details */}
          {listing.flight && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Flight details</h2>
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{listing.flight.origin_iata}</p>
                  <p className="text-gray-500">{listing.flight.origin_city}</p>
                </div>
                <div className="flex-1 flex flex-col items-center text-gray-400 text-xs gap-1">
                  <p>{listing.flight.airline} · {listing.flight.flight_number}</p>
                  <div className="flex items-center gap-2 w-full max-w-32">
                    <div className="h-px flex-1 bg-gray-200" />
                    <Plane className="w-3 h-3" />
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <p>{fmtDuration(listing.flight.duration_minutes)}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{listing.flight.destination_iata}</p>
                  <p className="text-gray-500">{listing.flight.destination_city}</p>
                </div>
              </div>
            </div>
          )}

          {/* Car rental details */}
          {listing.car_rental && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Vehicle details</h2>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div><span className="font-medium text-gray-800">Make: </span>{listing.car_rental.make}</div>
                <div><span className="font-medium text-gray-800">Model: </span>{listing.car_rental.model}</div>
                <div><span className="font-medium text-gray-800">Year: </span>{listing.car_rental.year}</div>
                <div><span className="font-medium text-gray-800">Seats: </span>{listing.car_rental.seats}</div>
                <div><span className="font-medium text-gray-800">Transmission: </span>{listing.car_rental.transmission}</div>
                <div><span className="font-medium text-gray-800">Fuel: </span>{listing.car_rental.fuel_type}</div>
              </div>
            </div>
          )}

          {/* Bus details */}
          {listing.bus && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Bus details</h2>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{listing.bus.origin_city}</p>
                  <p className="text-gray-500 text-xs">Origin</p>
                </div>
                <div className="text-center text-gray-400 text-xs">
                  <p>{listing.bus.operator}</p>
                  <p>{fmtDuration(listing.bus.duration_minutes)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">{listing.bus.destination_city}</p>
                  <p className="text-gray-500 text-xs">Destination</p>
                </div>
              </div>
            </div>
          )}

          {/* Train details */}
          {listing.train && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Train details</h2>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-bold text-gray-900">{listing.train.origin_city}</p>
                  <p className="text-gray-400 text-xs">{listing.train.origin_station}</p>
                </div>
                <div className="text-center text-gray-400 text-xs">
                  <p>{listing.train.operator} · {listing.train.train_number}</p>
                  <p>{fmtDuration(listing.train.duration_minutes)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{listing.train.destination_city}</p>
                  <p className="text-gray-400 text-xs">{listing.train.destination_station}</p>
                </div>
              </div>
            </div>
          )}

          {/* Provider info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Hosted by</h2>
            <p className="text-gray-800 font-medium">{listing.provider.business_name}</p>
            {listing.provider.city && <p className="text-gray-500 text-sm">{listing.provider.city}</p>}
          </div>

          {/* Reviews */}
          {listing.reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Guest reviews</h2>
              {listing.reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800">{r.user.name ?? 'Guest'}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">{fmt(listing.base_price)}</p>
              <p className="text-gray-400 text-sm">{perUnit}</p>
            </div>

            <hr className="border-gray-100" />

            {session ? (
              <>
                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Online booking coming soon. Contact the provider to reserve.</p>
                </div>
                <a
                  href={`mailto:${listing.provider.business_name.toLowerCase().replace(/\s+/g, '')}@orbyatravel.com?subject=Booking enquiry: ${listing.title}`}
                  className="block text-center w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  Contact to book
                </a>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">Sign in to enquire about booking</p>
                <Link
                  href={`/auth/signin?callbackUrl=/listings/${listing.slug}`}
                  className="block text-center w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  Sign in to book
                </Link>
                <Link
                  href="/auth/signup"
                  className="block text-center w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  Create account
                </Link>
              </>
            )}

            <div className="text-xs text-gray-400 text-center">Secure payments · No hidden fees</div>
          </div>
        </div>
      </div>
    </div>
  )
}
