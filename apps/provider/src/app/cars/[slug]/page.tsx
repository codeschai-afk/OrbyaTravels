import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { CarForm } from '../CarForm'
import { notFound } from 'next/navigation'

export default async function CarEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const { slug } = await params
  const listing = await prisma.listing.findFirst({
    where: { slug, provider_id: profile.id, type: 'CAR_RENTAL' },
    include: { car_rental: true },
  })
  if (!listing) notFound()

  const countries = await prisma.country.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, iso_code: true },
  })

  const cr = listing.car_rental

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit car rental</h1>
      <p className="text-gray-500 text-sm mb-8">
        Status: <span className="font-medium capitalize">{listing.approval_status.toLowerCase()}</span>
        {listing.approval_status === 'REJECTED' && listing.rejection_reason && (
          <span className="text-red-600"> — {listing.rejection_reason}</span>
        )}
      </p>
      <CarForm
        countries={countries}
        listingId={listing.id}
        defaultValues={{
          title:            listing.title,
          description:      listing.description,
          country_id:       listing.country_id,
          base_price:       Number(listing.base_price),
          currency:         listing.currency,
          make:             cr?.make ?? '',
          model:            cr?.model ?? '',
          year:             cr?.year ?? 2023,
          transmission:     (cr?.transmission as 'MANUAL' | 'AUTOMATIC') ?? 'AUTOMATIC',
          fuel_type:        (cr?.fuel_type as 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID') ?? 'PETROL',
          seats:            cr?.seats ?? 5,
          price_per_day:    cr ? Number(cr.price_per_day) : 0,
          pickup_location:  cr?.pickup_location ?? '',
          dropoff_location: cr?.dropoff_location ?? '',
          total_vehicles:   cr?.total_vehicles ?? 1,
          features:         cr?.features ?? [],
        }}
      />
    </div>
  )
}
