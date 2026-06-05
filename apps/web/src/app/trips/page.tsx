import Link from 'next/link'
import { prisma } from '@orbyatravel/db'
import { Shield, ArrowRight } from 'lucide-react'

const GRADIENT: Record<string, string> = {
  japan:    'from-rose-500 to-pink-700',
  italy:    'from-emerald-500 to-green-700',
  thailand: 'from-amber-400 to-orange-600',
  france:   'from-blue-500 to-indigo-700',
  greece:   'from-sky-400 to-blue-700',
  morocco:  'from-orange-500 to-red-700',
}

const ADVISORY_STYLE: Record<string, string> = {
  NONE:   'bg-green-500/20 text-green-100',
  LOW:    'bg-yellow-500/20 text-yellow-100',
  MEDIUM: 'bg-orange-500/20 text-orange-100',
  HIGH:   'bg-red-500/20 text-red-100',
}

export default async function TripsPage() {
  const countries = await prisma.country.findMany({
    where: { is_active: true },
    include: { hero_images: { orderBy: { sort_order: 'asc' }, take: 1 } },
    orderBy: [{ is_featured: 'desc' }, { name: 'asc' }],
  })

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Choose your destination</h1>
          <p className="text-gray-500 mt-2">Select a country to browse hotels, flights, transport and more</p>
        </div>

        {countries.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">No destinations available yet</p>
            <p className="text-sm mt-1">Check back soon — we&apos;re adding destinations regularly</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {countries.map((country) => {
              const hero = country.hero_images[0]
              const gradient = GRADIENT[country.slug] ?? 'from-brand-500 to-brand-700'
              const advisoryLabel = country.travel_advisory === 'NONE' ? 'Safe' : country.travel_advisory.toLowerCase()

              return (
                <Link
                  key={country.id}
                  href={`/trips/${country.slug}`}
                  className="group relative overflow-hidden rounded-2xl h-60 flex flex-col justify-end cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
                >
                  {hero ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hero.url}
                      alt={hero.alt_text ?? country.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                  <div className="relative z-10 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full backdrop-blur ${ADVISORY_STYLE[country.travel_advisory] ?? 'bg-white/20 text-white'}`}>
                        <Shield className="w-3 h-3" />
                        {advisoryLabel}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur rounded-full p-2">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-xl">{country.name}</h3>
                    {country.description && (
                      <p className="text-white/75 text-sm mt-0.5 line-clamp-1">{country.description}</p>
                    )}
                    {country.is_featured && (
                      <span className="mt-2 inline-block text-xs bg-brand-500/80 text-white px-2 py-0.5 rounded-full">Featured</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
