import Link from 'next/link'
import { ArrowRight, Shield } from 'lucide-react'
import { prisma } from '@orbyatravel/db'

const FALLBACK_GRADIENTS: Record<string, string> = {
  nepal: 'from-emerald-600 to-teal-800',
  india: 'from-orange-500 to-amber-700',
}

const FALLBACK_BADGES: Record<string, string> = {
  nepal: '🏔️',
  india: '🌺',
}

const ADVISORY_LABEL: Record<string, string> = {
  NONE: 'Safe', LOW: 'Low risk', MEDIUM: 'Medium risk', HIGH: 'High risk',
}

export async function FeaturedCountries() {
  const countries = await prisma.country.findMany({
    where: { is_active: true, is_featured: true },
    include: { hero_images: { orderBy: { sort_order: 'asc' }, take: 1 } },
    orderBy: { name: 'asc' },
    take: 6,
  })

  if (countries.length === 0) return null

  return (
    <section id="destinations" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-2">
              Popular destinations
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Where do you want to go?
            </h2>
          </div>
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-brand-600 font-medium text-sm hover:text-brand-700 transition-colors shrink-0"
          >
            View all destinations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country) => {
            const hero = country.hero_images[0]
            const gradient = FALLBACK_GRADIENTS[country.slug] ?? 'from-brand-500 to-brand-700'
            const badge = FALLBACK_BADGES[country.slug] ?? '🌍'
            const advisoryLabel = ADVISORY_LABEL[country.travel_advisory] ?? 'Safe'

            return (
              <Link
                key={country.slug}
                href={`/trips/${country.slug}`}
                className="group relative overflow-hidden rounded-2xl h-56 flex flex-col justify-end cursor-pointer"
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
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <div className="relative z-10 p-6">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{badge}</span>
                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
                      <Shield className="w-3 h-3" />
                      {advisoryLabel}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl">{country.name}</h3>
                  {country.description && (
                    <p className="text-white/80 text-sm line-clamp-1">{country.description}</p>
                  )}
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="bg-white/20 backdrop-blur rounded-full p-2">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
