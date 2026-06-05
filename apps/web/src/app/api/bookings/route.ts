import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  listing_id: z.string(),
  country_id: z.string(),
  item_type:  z.enum(['ACCOMMODATION', 'FLIGHT', 'BUS', 'TRAIN', 'CAR_RENTAL']),
  // Accommodation
  check_in_date:  z.string().optional(),
  check_out_date: z.string().optional(),
  room_type_id:   z.string().nullable().optional(),
  quantity:       z.number().int().positive().default(1),
  // Flight
  flight_schedule_id: z.string().nullable().optional(),
  seat_class:         z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
  passenger_count:    z.number().int().positive().default(1),
  // Transport (bus/train)
  transport_schedule_id: z.string().nullable().optional(),
  // Car rental
  pickup_date: z.string().optional(),
  return_date: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data

  const listing = await prisma.listing.findFirst({
    where: { id: d.listing_id, approval_status: 'APPROVED', is_active: true },
    include: {
      accommodation:      { include: { room_types: true } },
      flight:             { include: { schedules: { where: { is_active: true } } } },
      car_rental:         true,
      transport_schedules: { where: { is_active: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  // Compute unit price + total
  let unitPrice: number
  let totalPrice: number
  let qty: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta: any = { listing_title: listing.title }

  if (d.item_type === 'ACCOMMODATION') {
    if (!d.check_in_date || !d.check_out_date) {
      return NextResponse.json({ error: 'Check-in and check-out dates required' }, { status: 400 })
    }
    const nights = Math.ceil((new Date(d.check_out_date).getTime() - new Date(d.check_in_date).getTime()) / 86400000)
    if (nights < 1) return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    const room = d.room_type_id
      ? listing.accommodation?.room_types.find((r) => r.id === d.room_type_id)
      : listing.accommodation?.room_types[0]
    unitPrice = Number(room?.price_per_night ?? listing.base_price)
    qty = d.quantity
    totalPrice = unitPrice * nights * qty
    meta.nights = nights
    meta.room_type = room?.name
  } else if (d.item_type === 'CAR_RENTAL') {
    if (!d.pickup_date || !d.return_date) {
      return NextResponse.json({ error: 'Pickup and return dates required' }, { status: 400 })
    }
    const days = Math.ceil((new Date(d.return_date).getTime() - new Date(d.pickup_date).getTime()) / 86400000)
    if (days < 1) return NextResponse.json({ error: 'Return date must be after pickup' }, { status: 400 })
    unitPrice = Number(listing.car_rental?.price_per_day ?? listing.base_price)
    qty = days
    totalPrice = unitPrice * days
    meta.days = days
  } else if (d.item_type === 'FLIGHT') {
    const schedule = d.flight_schedule_id
      ? listing.flight?.schedules.find((s) => s.id === d.flight_schedule_id)
      : listing.flight?.schedules[0]
    const classPrices: Record<string, number> = {
      ECONOMY:  Number(schedule?.price_economy  ?? listing.base_price),
      BUSINESS: Number(schedule?.price_business ?? listing.base_price),
      FIRST:    Number(schedule?.price_first    ?? listing.base_price),
    }
    unitPrice = classPrices[d.seat_class]
    qty = d.passenger_count
    totalPrice = unitPrice * qty
    meta.seat_class = d.seat_class
    meta.departure = schedule?.departure_at
  } else {
    // BUS or TRAIN
    const schedule = d.transport_schedule_id
      ? listing.transport_schedules.find((s) => s.id === d.transport_schedule_id)
      : listing.transport_schedules[0]
    unitPrice = Number(schedule?.price_per_seat ?? listing.base_price)
    qty = d.passenger_count
    totalPrice = unitPrice * qty
    meta.departure = schedule?.departure_at
  }

  const booking = await prisma.booking.create({
    data: {
      customer_id:  session.user.id,
      country_id:   d.country_id,
      status:       'CONFIRMED',
      total_amount: totalPrice,
      currency:     listing.currency,
      items: {
        create: {
          listing_id:  d.listing_id,
          item_type:   d.item_type,
          quantity:    qty,
          unit_price:  unitPrice,
          total_price: totalPrice,
          currency:    listing.currency,
          check_in_date:         d.check_in_date  ? new Date(d.check_in_date)  : null,
          check_out_date:        d.check_out_date ? new Date(d.check_out_date) : null,
          room_type_id:          d.room_type_id   ?? null,
          flight_schedule_id:    d.flight_schedule_id    ?? null,
          transport_schedule_id: d.transport_schedule_id ?? null,
          seat_class:            d.item_type === 'FLIGHT' ? d.seat_class : null,
          passenger_count:       d.passenger_count,
          pickup_date:  d.pickup_date  ? new Date(d.pickup_date)  : null,
          return_date:  d.return_date  ? new Date(d.return_date)  : null,
          metadata:    meta,
        },
      },
      status_history: {
        create: {
          to_status:  'CONFIRMED',
          created_by: session.user.id,
          note:       'Booking created',
        },
      },
    },
  })

  return NextResponse.json({ booking_id: booking.id })
}
