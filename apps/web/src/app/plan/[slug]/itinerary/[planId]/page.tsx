import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import { ItineraryEditor } from './ItineraryEditor'

export default async function ItineraryPage({ params }: { params: { slug: string; planId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const [plan, listings] = await Promise.all([
    prisma.tripPlan.findUnique({
      where: { id: params.planId, user_id: session.user.id },
      include: {
        country: { select: { id: true, name: true, slug: true } },
        days: {
          orderBy: { day_number: 'asc' },
          include: {
            legs: {
              orderBy: { order: 'asc' },
              include: { listing: { select: { id: true, title: true, type: true, base_price: true } } },
            },
          },
        },
      },
    }),
    // Fetch all approved provider listings for this country (for the swap panel)
    prisma.listing.findMany({
      where: {
        country: { slug: params.slug },
        approval_status: 'APPROVED',
        is_active: true,
      },
      select: {
        id: true, title: true, type: true, base_price: true, slug: true,
        accommodation: { select: { city: true, stars: true } },
        car_rental:    { select: { make: true, model: true } },
      },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!plan) notFound()

  // Serialize plan for client
  const planData = {
    id:           plan.id,
    title:        plan.title,
    duration_days: plan.duration_days,
    travel_style: plan.travel_style as string,
    country:      plan.country,
    days: plan.days.map((d) => ({
      id:         d.id,
      day_number: d.day_number,
      title:      d.title ?? `Day ${d.day_number}`,
      notes:      d.notes ?? '',
      legs: d.legs.map((l) => ({
        id:               l.id,
        order:            l.order,
        type:             l.type as string,
        title:            l.title,
        description:      l.description ?? '',
        duration_minutes: l.duration_minutes ?? null,
        tip:              l.tip ?? null,
        listing_id:       l.listing_id ?? null,
        listing:          l.listing ? {
          id:         l.listing.id,
          title:      l.listing.title,
          type:       l.listing.type as string,
          base_price: Number(l.listing.base_price),
        } : null,
      })),
    })),
  }

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

  return <ItineraryEditor plan={planData} listings={listingData} />
}
