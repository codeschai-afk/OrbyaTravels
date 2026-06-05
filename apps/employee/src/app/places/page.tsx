import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { Plus, MapPin, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { DeletePlaceButton } from './DeletePlaceButton'

const CATEGORY_COLOR: Record<string, string> = {
  BEACH:      'bg-blue-100 text-blue-700',
  TEMPLE:     'bg-purple-100 text-purple-700',
  MUSEUM:     'bg-amber-100 text-amber-700',
  MARKET:     'bg-green-100 text-green-700',
  PARK:       'bg-emerald-100 text-emerald-700',
  MOUNTAIN:   'bg-gray-100 text-gray-700',
  CITY:       'bg-indigo-100 text-indigo-700',
  VILLAGE:    'bg-lime-100 text-lime-700',
  RESTAURANT: 'bg-orange-100 text-orange-700',
  NIGHTLIFE:  'bg-pink-100 text-pink-700',
  ADVENTURE:  'bg-red-100 text-red-700',
  HISTORICAL: 'bg-yellow-100 text-yellow-700',
  OTHER:      'bg-gray-100 text-gray-600',
}

export default async function PlacesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') redirect('/auth/signin')

  const countries = await prisma.country.findMany({
    where: { is_active: true },
    include: {
      places: {
        include: { images: { take: 1, orderBy: { sort_order: 'asc' } } },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const totalPlaces = countries.reduce((s, c) => s + c.places.length, 0)

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Places</h1>
          <p className="text-gray-500 text-sm mt-1">{totalPlaces} curated visiting spots across {countries.length} countries</p>
        </div>
        <Link
          href="/places/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add place
        </Link>
      </div>

      {countries.map((country) => (
        <div key={country.id} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-gray-700">{country.name}</h2>
            <span className="text-xs text-gray-400">({country.places.length} places)</span>
          </div>

          {country.places.length === 0 ? (
            <div className="text-sm text-gray-400 ml-6">No places yet —{' '}
              <Link href={`/places/new?country=${country.id}`} className="text-blue-500 hover:underline">add one</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {country.places.map((place) => {
                const img = place.images[0]
                return (
                  <div key={place.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={img.alt_text ?? place.name} className="h-36 w-full object-cover" />
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-blue-200" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{place.name}</p>
                        {place.is_active
                          ? <Eye className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          : <EyeOff className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                        }
                      </div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${CATEGORY_COLOR[place.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {place.category.charAt(0) + place.category.slice(1).toLowerCase()}
                      </span>
                      {place.city && <p className="text-xs text-gray-400">{place.city}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/places/${place.id}/edit`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors">
                          <Edit className="w-3 h-3" /> Edit
                        </Link>
                        <DeletePlaceButton id={place.id} name={place.name} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
