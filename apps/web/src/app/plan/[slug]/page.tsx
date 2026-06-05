import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import { PlanClient } from './PlanClient'

export default async function PlanCountryPage({ params }: { params: { slug: string } }) {
  const session = await auth()

  const country = await prisma.country.findUnique({
    where: { slug: params.slug, is_active: true },
    include: {
      hero_images: { take: 1, orderBy: { sort_order: 'asc' } },
      places: {
        where: { is_active: true },
        include: { images: { take: 1, orderBy: { sort_order: 'asc' } } },
        orderBy: { name: 'asc' },
      },
    },
  })
  if (!country) notFound()

  // Load user's bucketlist for this country (if signed in)
  const bucketList = session?.user?.id
    ? await prisma.bucketListItem.findMany({
        where: { user_id: session.user.id, place: { country_id: country.id } },
        select: { place_id: true, notes: true },
      })
    : []

  const bucketListIds = new Set(bucketList.map((b) => b.place_id))

  const places = country.places.map((p) => ({
    id:          p.id,
    name:        p.name,
    slug:        p.slug,
    description: p.description ?? '',
    category:    p.category as string,
    city:        p.city ?? '',
    latitude:    Number(p.latitude),
    longitude:   Number(p.longitude),
    image:       p.images[0]?.url ?? null,
    inBucket:    bucketListIds.has(p.id),
  }))

  return (
    <PlanClient
      country={{ id: country.id, name: country.name, slug: country.slug, hero: country.hero_images[0]?.url ?? null }}
      places={places}
      isSignedIn={!!session}
    />
  )
}
