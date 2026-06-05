import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@orbyatravel/db'
import { Shield, Hotel, Car, Bus, Plane, Train, ArrowLeft, Star } from 'lucide-react'

const TYPE_TABS = [
  { value: 'ACCOMMODATION', label: 'Hotels',     icon: Hotel },
  { value: 'CAR_RENTAL',    label: 'Car rentals', icon: Car },
  { value: 'BUS',           label: 'Buses',       icon: Bus },
  { value: 'FLIGHT',        label: 'Flights',     icon: Plane },
  { value: 'TRAIN',         label: 'Trains',      icon: Train },
]

const ADVISORY_STYLE: Record<string, string> = {
  NONE:   'bg-green-100 text-green-700',
  LOW:    'bg-yellow-100 text-yellow-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH:   'bg-red-100 text-red-700',
}

function fmt(price: unknown) {
  return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { type?: string }
}) {
  const activeType = searchParams.type ?? 'ACCOMMODATION'

  const country = await prisma.country.findUnique({
    where: { slug: params.slug, is_active: true },
    include: { hero_images: { orderBy: { sort_order: 'asc' }, take: 1 } },
  })
  if (!country) notFound()

  const listings = await prisma.listing.findMany({
    where: { country_id: country.id, approval_status: 'APPROVED', is_active: true, type: activeType as any },
    include: {
      provider:      { select: { business_name: true, city: true } },
      accommodation: { select: { city: true, stars: true } },
      car_rental:    { select: { make: true, model: true, year: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 24,
  })

  const hero = country.hero_images[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 sm:h-96">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.url} alt={country.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-7xl mx-auto">
          <Link href="/trips" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> All destinations
          </Link>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">{country.name}</h1>
              {country.description && (
                <p className="text-white/80 text-sm mt-2 max-w-xl">{country.description}</p>
              )}
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${ADVISORY_STYLE[country.travel_advisory]}`}>
              <Shield className="w-3.5 h-3.5" />
              {country.travel_advisory === 'NONE' ? 'Safe to visit' : `${country.travel_advisory.toLowerCase()} risk`}
            </span>
          </div>
        </div>
      </div>

      {/* Type tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto py-2 no-scrollbar">
          {TYPE_TABS.map(({ value, label, icon: Icon }) => (
            <Link
              key={value}
              href={`/trips/${params.slug}?type=${value}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeType === value
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-medium text-gray-600">No {TYPE_TABS.find(t => t.value === activeType)?.label.toLowerCase()} listings yet</p>
            <p className="text-sm mt-1">Providers are being verified — check back soon</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">{listings.length} result{listings.length !== 1 ? 's' : ''} in {country.name}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.slug}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

                  {/* Placeholder image */}
                  <div className="h-44 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                    {TYPE_TABS.find(t => t.value === listing.type) && (() => {
                      const { icon: Icon } = TYPE_TABS.find(t => t.value === listing.type)!
                      return <Icon className="w-12 h-12 text-brand-400" />
                    })()}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-brand-600 transition-colors line-clamp-2">
                        {listing.title}
                      </h3>
                      {listing.accommodation?.stars && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {Array.from({ length: listing.accommodation.stars }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mb-3">
                      {listing.accommodation?.city ?? listing.provider.city ?? listing.provider.business_name}
                    </p>

                    {listing.car_rental && (
                      <p className="text-xs text-gray-500 mb-3">
                        {listing.car_rental.year} {listing.car_rental.make} {listing.car_rental.model}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-brand-600 font-bold text-base">{fmt(listing.base_price)}</span>
                        <span className="text-gray-400 text-xs ml-1">
                          {listing.type === 'ACCOMMODATION' ? '/ night' : listing.type === 'CAR_RENTAL' ? '/ day' : '/ person'}
                        </span>
                      </div>
                      <span className="text-xs text-brand-600 font-medium group-hover:underline">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
