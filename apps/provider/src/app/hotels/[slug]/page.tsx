import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { HotelForm } from '../HotelForm'
import { notFound } from 'next/navigation'

export default async function HotelEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const { slug } = await params
  const listing = await prisma.listing.findFirst({
    where: { slug, provider_id: profile.id, type: 'ACCOMMODATION' },
    include: { accommodation: true },
  })
  if (!listing) notFound()

  const countries = await prisma.country.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, iso_code: true },
  })

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit hotel</h1>
      <p className="text-gray-500 text-sm mb-8">
        Status: <span className="font-medium capitalize">{listing.approval_status.toLowerCase()}</span>
        {listing.approval_status === 'REJECTED' && listing.rejection_reason && (
          <span className="text-red-600"> — {listing.rejection_reason}</span>
        )}
      </p>
      <HotelForm
        countries={countries}
        listingId={listing.id}
        defaultValues={{
          title:          listing.title,
          description:    listing.description,
          country_id:     listing.country_id,
          base_price:     Number(listing.base_price),
          currency:       listing.currency,
          address:        listing.accommodation?.address ?? '',
          city:           listing.accommodation?.city ?? '',
          stars:          listing.accommodation?.stars ?? undefined,
          amenities:      listing.accommodation?.amenities ?? [],
          check_in_time:  listing.accommodation?.check_in_time ?? '14:00',
          check_out_time: listing.accommodation?.check_out_time ?? '11:00',
        }}
      />
    </div>
  )
}
