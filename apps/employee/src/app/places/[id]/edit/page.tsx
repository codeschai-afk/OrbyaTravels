import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { PlaceForm } from '../../PlaceForm'

export default async function EditPlacePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') redirect('/auth/signin')

  const [place, countries] = await Promise.all([
    prisma.place.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { sort_order: 'asc' } } },
    }),
    prisma.country.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  if (!place) notFound()

  const formPlace = {
    id:          place.id,
    country_id:  place.country_id,
    name:        place.name,
    slug:        place.slug,
    description: place.description ?? '',
    category:       place.category as string,
    tags:           place.tags,
    pin_importance: place.pin_importance as 'MAJOR' | 'MEDIUM' | 'MINOR',
    city:           place.city ?? '',
    address:     place.address ?? '',
    latitude:    Number(place.latitude),
    longitude:   Number(place.longitude),
    is_active:   place.is_active,
    images:      place.images,
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit place: {place.name}</h1>
      <PlaceForm countries={countries} place={formPlace} />
    </div>
  )
}
