import Link from 'next/link'
import { ArrowRight, Shield } from 'lucide-react'
import { CloudinaryImage } from '@/components/ui/CloudinaryImage'

const COUNTRIES = [
  {
    name: 'Japan',
    slug: 'japan',
    tagline: 'Ancient temples & futuristic cities',
    gradient: 'from-rose-500 to-pink-700',
    badge: '🗾',
    advisory: 'Safe',
    heroPublicId: null as string | null, // set to Cloudinary public_id once images are uploaded
  },
  {
    name: 'Italy',
    slug: 'italy',
    tagline: 'Renaissance art & coastal villages',
    gradient: 'from-emerald-500 to-green-700',
    badge: '🏛️',
    advisory: 'Safe',
    heroPublicId: null as string | null,
  },
  {
    name: 'Thailand',
    slug: 'thailand',
    tagline: 'Tropical beaches & golden temples',
    gradient: 'from-amber-400 to-orange-600',
    badge: '🐘',
    advisory: 'Safe',
    heroPublicId: null as string | null,
  },
  {
    name: 'France',
    slug: 'france',
    tagline: 'Lavender fields & haute cuisine',
    gradient: 'from-blue-500 to-indigo-700',
    badge: '🗼',
    advisory: 'Safe',
    heroPublicId: null as string | null,
  },
  {
    name: 'Greece',
    slug: 'greece',
    tagline: 'Whitewashed villages & crystal waters',
    gradient: 'from-sky-400 to-blue-700',
    badge: '🏺',
    advisory: 'Safe',
    heroPublicId: null as string | null,
  },
  {
    name: 'Morocco',
    slug: 'morocco',
    tagline: 'Sahara dunes & spice bazaars',
    gradient: 'from-orange-500 to-red-700',
    badge: '🕌',
    advisory: 'Low risk',
    heroPublicId: null as string | null,
  },
]

export function FeaturedCountries() {
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
          {COUNTRIES.map((country) => (
            <Link
              key={country.slug}
              href={`/trips?country=${country.slug}`}
              className="group relative overflow-hidden rounded-2xl h-56 flex flex-col justify-end cursor-pointer"
            >
              {/* Background: real Cloudinary image OR gradient fallback */}
              {country.heroPublicId ? (
                <CloudinaryImage
                  publicId={country.heroPublicId}
                  alt={country.name}
                  width={600}
                  height={400}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  withBlur
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${country.gradient} transition-transform duration-500 group-hover:scale-105`}
                >
                  {/* Dot pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                </div>
              )}

              {/* Dark gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Content */}
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{country.badge}</span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    {country.advisory}
                  </span>
                </div>
                <h3 className="text-white font-bold text-xl">{country.name}</h3>
                <p className="text-white/80 text-sm">{country.tagline}</p>
              </div>

              {/* Arrow on hover */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-white/20 backdrop-blur rounded-full p-2">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
