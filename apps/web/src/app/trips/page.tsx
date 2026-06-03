import Link from 'next/link'
import { CloudinaryImage } from '@/components/ui/CloudinaryImage'
import { Shield, ArrowRight } from 'lucide-react'

interface Country {
  id: string
  name: string
  slug: string
  description: string | null
  travel_advisory: string
  hero_images: { id: string; url: string; alt_text: string | null }[]
}

async function getCountries(): Promise<Country[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  try {
    const res = await fetch(`${apiUrl}/v1/countries?active=true`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

const GRADIENT_FALLBACKS: Record<string, string> = {
  japan: 'from-rose-500 to-pink-700',
  italy: 'from-emerald-500 to-green-700',
  thailand: 'from-amber-400 to-orange-600',
  france: 'from-blue-500 to-indigo-700',
  greece: 'from-sky-400 to-blue-700',
  morocco: 'from-orange-500 to-red-700',
}

const ADVISORY_COLOUR: Record<string, string> = {
  NONE:   'bg-green-500/20 text-green-100',
  LOW:    'bg-yellow-500/20 text-yellow-100',
  MEDIUM: 'bg-orange-500/20 text-orange-100',
  HIGH:   'bg-red-500/20 text-red-100',
}

export default async function TripsPage() {
  const countries = await getCountries()

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Choose your destination</h1>
          <p className="text-gray-500 mt-2">Select a country to start building your trip</p>
        </div>

        {countries.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">No destinations available yet</p>
            <p className="text-sm mt-1">Check back soon — we&apos;re adding destinations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {countries.map((country) => {
              const heroImage = country.hero_images[0]
              const gradient = GRADIENT_FALLBACKS[country.slug] ?? 'from-brand-500 to-brand-700'

              return (
                <Link
                  key={country.id}
                  href={`/trips/${country.slug}`}
                  className="group relative overflow-hidden rounded-2xl h-60 flex flex-col justify-end cursor-pointer"
                >
                  {heroImage ? (
                    <CloudinaryImage
                      publicId={heroImage.url}
                      alt={country.name}
                      width={600}
                      height={400}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      withBlur
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  <div className="relative z-10 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full backdrop-blur ${ADVISORY_COLOUR[country.travel_advisory] ?? 'bg-white/20 text-white'}`}>
                        <Shield className="w-3 h-3" />
                        {country.travel_advisory === 'NONE' ? 'Safe' : country.travel_advisory}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur rounded-full p-2">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-xl">{country.name}</h3>
                    {country.description && (
                      <p className="text-white/75 text-sm mt-0.5 line-clamp-1">{country.description}</p>
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
