import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { FlightForm } from '../FlightForm'
import { notFound } from 'next/navigation'

export default async function FlightEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const { slug } = await params
  const listing = await prisma.listing.findFirst({
    where: { slug, provider_id: profile.id, type: 'FLIGHT' },
    include: { flight: true },
  })
  if (!listing) notFound()

  const countries = await prisma.country.findMany({
    where: { is_active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, iso_code: true },
  })

  const f = listing.flight
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit flight</h1>
      <p className="text-gray-500 text-sm mb-8">Status: <span className="font-medium capitalize">{listing.approval_status.toLowerCase()}</span></p>
      <FlightForm
        countries={countries}
        listingId={listing.id}
        defaultValues={{
          title: listing.title, description: listing.description,
          country_id: listing.country_id, base_price: Number(listing.base_price), currency: listing.currency,
          airline: f?.airline ?? '', flight_number: f?.flight_number ?? '',
          origin_city: f?.origin_city ?? '', origin_iata: f?.origin_iata ?? '',
          destination_city: f?.destination_city ?? '', destination_iata: f?.destination_iata ?? '',
          duration_minutes: f?.duration_minutes ?? 0,
        }}
      />
    </div>
  )
}
