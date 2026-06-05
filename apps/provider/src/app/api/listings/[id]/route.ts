import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const updateSchema = z.object({
  title:       z.string().min(3).max(120).optional(),
  description: z.string().min(10).optional(),
  base_price:  z.number().positive().optional(),
  is_active:   z.boolean().optional(),
  accommodation: z.object({
    address: z.string().optional(), city: z.string().optional(),
    stars: z.number().int().min(1).max(5).optional(), amenities: z.array(z.string()).optional(),
    check_in_time: z.string().optional(), check_out_time: z.string().optional(),
  }).optional(),
  car_rental: z.object({
    make: z.string().optional(), model: z.string().optional(), year: z.number().int().optional(),
    transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
    fuel_type: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']).optional(),
    seats: z.number().int().optional(), price_per_day: z.number().optional(),
    pickup_location: z.string().optional(), dropoff_location: z.string().optional(),
    total_vehicles: z.number().int().optional(), features: z.array(z.string()).optional(),
  }).optional(),
  bus: z.object({
    operator: z.string().optional(), origin_city: z.string().optional(),
    destination_city: z.string().optional(), duration_minutes: z.number().int().optional(),
    bus_type: z.string().optional(), amenities: z.array(z.string()).optional(),
  }).optional(),
  flight: z.object({
    airline: z.string().optional(), flight_number: z.string().optional(),
    origin_city: z.string().optional(), origin_iata: z.string().optional(),
    destination_city: z.string().optional(), destination_iata: z.string().optional(),
    duration_minutes: z.number().int().optional(),
  }).optional(),
  train: z.object({
    operator: z.string().optional(), train_number: z.string().optional(),
    origin_city: z.string().optional(), origin_station: z.string().optional(),
    destination_city: z.string().optional(), destination_station: z.string().optional(),
    duration_minutes: z.number().int().optional(),
  }).optional(),
})

async function getOwnedListing(id: string, userId: string) {
  const profile = await prisma.providerProfile.findUnique({ where: { user_id: userId } })
  if (!profile) return null
  return prisma.listing.findFirst({
    where: { id, provider_id: profile.id },
    include: { accommodation: true, car_rental: true, bus: true, flight: true, train: true,
      country: { select: { name: true, iso_code: true } },
      images: { orderBy: { sort_order: 'asc' } },
    },
  })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const listing = await getOwnedListing(id, session.user.id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: listing })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const listing = await getOwnedListing(id, session.user.id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = updateSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { accommodation, car_rental, bus, flight, train, ...listingData } = body.data

  const updated = await prisma.$transaction(async (tx) => {
    const l = await tx.listing.update({ where: { id }, data: listingData })

    if (accommodation && l.type === 'ACCOMMODATION') {
      await tx.accommodationDetail.upsert({
        where: { listing_id: id }, update: accommodation,
        create: { listing_id: id, address: '', city: '', ...accommodation },
      })
    } else if (car_rental && l.type === 'CAR_RENTAL') {
      await tx.carRentalDetail.upsert({
        where: { listing_id: id }, update: car_rental,
        create: {
          listing_id: id, make: '', model: '', year: 2024,
          transmission: 'AUTOMATIC', fuel_type: 'PETROL', seats: 5,
          price_per_day: 0, pickup_location: '', total_vehicles: 1, ...car_rental,
        },
      })
    } else if (bus && l.type === 'BUS') {
      await tx.busDetail.upsert({
        where: { listing_id: id }, update: bus,
        create: { listing_id: id, operator: '', origin_city: '', destination_city: '', duration_minutes: 0, bus_type: '', ...bus },
      })
    } else if (flight && l.type === 'FLIGHT') {
      await tx.flightDetail.upsert({
        where: { listing_id: id }, update: flight,
        create: { listing_id: id, airline: '', flight_number: '', origin_city: '', origin_iata: '', destination_city: '', destination_iata: '', duration_minutes: 0, ...flight },
      })
    } else if (train && l.type === 'TRAIN') {
      await tx.trainDetail.upsert({
        where: { listing_id: id }, update: train,
        create: { listing_id: id, operator: '', train_number: '', origin_city: '', origin_station: '', destination_city: '', destination_station: '', duration_minutes: 0, ...train },
      })
    }

    return l
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const listing = await getOwnedListing(id, session.user.id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.listing.delete({ where: { id } })
  return NextResponse.json({ data: { deleted: true } })
}
