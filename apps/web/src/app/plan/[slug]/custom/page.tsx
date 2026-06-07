import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import { CustomPlanBuilder } from './CustomPlanBuilder'

export default async function CustomPlanPage({ params }: { params: { slug: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/plan/${params.slug}/custom`)

  const country = await prisma.country.findUnique({
    where: { slug: params.slug, is_active: true },
    select: { id: true, name: true, slug: true },
  })
  if (!country) notFound()

  const [places, listings] = await Promise.all([
    prisma.place.findMany({
      where:   { country_id: country.id, is_active: true },
      select:  { id: true, name: true, city: true, category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.listing.findMany({
      where:   { country_id: country.id, approval_status: 'APPROVED', is_active: true },
      select:  { id: true, title: true, type: true, base_price: true, slug: true,
        accommodation: { select: { city: true, stars: true } },
        car_rental:    { select: { make: true, model: true } },
      },
      orderBy: { title: 'asc' },
    }),
  ])

  const placeData = places.map((p) => ({
    id:       p.id,
    name:     p.name,
    city:     p.city ?? '',
    category: p.category as string,
  }))

  const listingData = listings.map((l) => ({
    id:         l.id,
    title:      l.title,
    type:       l.type as string,
    base_price: Number(l.base_price),
    slug:       l.slug,
    city:       l.accommodation?.city ?? null,
    stars:      l.accommodation?.stars ?? null,
    vehicle:    l.car_rental ? `${l.car_rental.make} ${l.car_rental.model}` : null,
  }))

  return (
    <CustomPlanBuilder
      country={{ id: country.id, name: country.name, slug: country.slug }}
      places={placeData}
      listings={listingData}
    />
  )
}
