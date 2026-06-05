import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const createSchema = z.object({
  type:        z.enum(['ACCOMMODATION', 'FLIGHT', 'BUS', 'TRAIN', 'CAR_RENTAL']),
  country_id:  z.string().cuid(),
  title:       z.string().min(3).max(120),
  description: z.string().min(10),
  base_price:  z.number().positive(),
  currency:    z.string().length(3).default('USD'),
  accommodation: z.object({
    address: z.string(), city: z.string(), stars: z.number().optional(),
    amenities: z.array(z.string()).default([]),
    check_in_time: z.string().default('14:00'), check_out_time: z.string().default('11:00'),
    latitude: z.number().optional(), longitude: z.number().optional(),
  }).optional(),
  car_rental: z.object({
    make: z.string(), model: z.string(), year: z.number().int(),
    transmission: z.enum(['MANUAL', 'AUTOMATIC']),
    fuel_type: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']),
    seats: z.number().int(), price_per_day: z.number(),
    pickup_location: z.string(), dropoff_location: z.string().optional(),
    total_vehicles: z.number().int().default(1), features: z.array(z.string()).default([]),
    latitude: z.number().optional(), longitude: z.number().optional(),
  }).optional(),
  bus: z.object({
    operator: z.string(), origin_city: z.string(), destination_city: z.string(),
    duration_minutes: z.number().int(), bus_type: z.string(),
    amenities: z.array(z.string()).default([]),
  }).optional(),
  flight: z.object({
    airline: z.string(), flight_number: z.string(),
    origin_city: z.string(), origin_iata: z.string(),
    destination_city: z.string(), destination_iata: z.string(),
    duration_minutes: z.number().int(),
  }).optional(),
  train: z.object({
    operator: z.string(), train_number: z.string(),
    origin_city: z.string(), origin_station: z.string(),
    destination_city: z.string(), destination_station: z.string(),
    duration_minutes: z.number().int(),
  }).optional(),
})

function generateSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) return NextResponse.json({ data: [] })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const listings = await prisma.listing.findMany({
    where: { provider_id: profile.id, ...(type ? { type: type as never } : {}) },
    include: { country: { select: { name: true, iso_code: true } }, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ data: listings })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) return NextResponse.json({ error: 'No provider profile' }, { status: 403 })

  const body = createSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { accommodation, car_rental, bus, flight, train, ...listingData } = body.data
  const slug = generateSlug(listingData.title)

  const listing = await prisma.$transaction(async (tx) => {
    const l = await tx.listing.create({ data: { ...listingData, slug, provider_id: profile.id } })

    if (l.type === 'ACCOMMODATION' && accommodation) {
      await tx.accommodationDetail.create({ data: { listing_id: l.id, ...accommodation } })
    } else if (l.type === 'CAR_RENTAL' && car_rental) {
      await tx.carRentalDetail.create({ data: { listing_id: l.id, ...car_rental } })
    } else if (l.type === 'BUS' && bus) {
      await tx.busDetail.create({ data: { listing_id: l.id, ...bus } })
    } else if (l.type === 'FLIGHT' && flight) {
      await tx.flightDetail.create({ data: { listing_id: l.id, ...flight } })
    } else if (l.type === 'TRAIN' && train) {
      await tx.trainDetail.create({ data: { listing_id: l.id, ...train } })
    }

    return l
  })

  return NextResponse.json({ data: listing }, { status: 201 })
}
