import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import { PlanClient } from './PlanClient'

const COUNTRY_CENTERS: Record<string, [number, number]> = {
  india:     [22.5, 80.0],
  nepal:     [28.3, 84.1],
  japan:     [36.2, 138.2],
  italy:     [42.8, 12.8],
  thailand:  [13.0, 101.5],
  france:    [46.6, 2.3],
  greece:    [39.1, 22.4],
  morocco:   [31.8, -7.1],
  indonesia: [-2.5, 117.9],
  spain:     [40.4, -3.7],
}

export default async function PlanCountryPage({ params }: { params: { slug: string } }) {
  const session = await auth()

  const country = await prisma.country.findUnique({
    where: { slug: params.slug, is_active: true },
    include: {
      hero_images: { take: 1, orderBy: { sort_order: 'asc' } },
      places: {
        where: { is_active: true },
        include: { images: { orderBy: { sort_order: 'asc' } } },
        orderBy: { name: 'asc' },
      },
    },
  })
  if (!country) notFound()

  const bucketList = session?.user?.id
    ? await prisma.bucketListItem.findMany({
        where: { user_id: session.user.id, place: { country_id: country.id } },
        select: { place_id: true },
      })
    : []
  const bucketListIds = new Set(bucketList.map((b) => b.place_id))

  // Approved providers with their active listings for this country
  const providers = await prisma.providerProfile.findMany({
    where: {
      verification_status: 'APPROVED',
      listings: { some: { country_id: country.id, is_active: true, approval_status: 'APPROVED' } },
    },
    select: {
      id:            true,
      business_name: true,
      service_types: true,
      city:          true,
      contact_email: true,
      contact_phone: true,
      listings: {
        where: { country_id: country.id, is_active: true, approval_status: 'APPROVED' },
        select: { id: true, title: true, type: true, base_price: true, slug: true },
        orderBy: { base_price: 'asc' },
      },
    },
  })

  const places = country.places.map((p) => ({
    id:             p.id,
    name:           p.name,
    slug:           p.slug,
    description:    p.description ?? '',
    category:       p.category as string,
    city:           p.city ?? '',
    latitude:       Number(p.latitude),
    longitude:      Number(p.longitude),
    images:         p.images.map((i) => i.url),
    inBucket:       bucketListIds.has(p.id),
    pin_importance: (p.pin_importance as string ?? 'MAJOR') as 'MAJOR' | 'MEDIUM' | 'MINOR',
  }))

  const initialCenter: [number, number] = places.length > 0
    ? [
        places.reduce((s, p) => s + p.latitude,  0) / places.length,
        places.reduce((s, p) => s + p.longitude, 0) / places.length,
      ]
    : (COUNTRY_CENTERS[country.slug] ?? [20, 80])

  const serializedProviders = providers.map((p) => ({
    ...p,
    listings: p.listings.map((l) => ({
      ...l,
      base_price: Number(l.base_price),
      type: l.type as string,
    })),
  }))

  return (
    <PlanClient
      country={{ id: country.id, name: country.name, slug: country.slug, hero: country.hero_images[0]?.url ?? null }}
      places={places}
      providers={serializedProviders}
      isSignedIn={!!session}
      initialCenter={initialCenter}
    />
  )
}
