import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  plan_id: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to checkout' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const plan = await prisma.tripPlan.findUnique({
    where: { id: body.data.plan_id, user_id: session.user.id },
    include: {
      country: true,
      days: {
        include: {
          legs: {
            where: { listing_id: { not: null } },
            include: { listing: { select: { id: true, title: true, type: true, base_price: true, currency: true } } },
          },
        },
      },
    },
  })

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Collect all legs with real provider listings
  const bookedLegs = plan.days.flatMap((d) => d.legs.filter((l) => l.listing_id && l.listing))
  if (bookedLegs.length === 0) {
    return NextResponse.json({ error: 'No provider bookings in this plan. Use "Edit plan" → "Book provider" to add listings.' }, { status: 400 })
  }

  const totalAmount = bookedLegs.reduce((sum, leg) => sum + Number(leg.listing!.base_price), 0)

  const booking = await prisma.booking.create({
    data: {
      customer_id:  session.user.id,
      country_id:   plan.country_id,
      status:       'CONFIRMED',
      total_amount: totalAmount,
      currency:     'USD',
      notes:        `From trip plan: ${plan.title}`,
      items: {
        create: bookedLegs.map((leg) => ({
          listing_id:  leg.listing_id!,
          item_type:   leg.listing!.type as 'ACCOMMODATION' | 'FLIGHT' | 'BUS' | 'TRAIN' | 'CAR_RENTAL',
          quantity:    1,
          unit_price:  leg.listing!.base_price,
          total_price: leg.listing!.base_price,
          currency:    leg.listing!.currency,
          passenger_count: 1,
          metadata:    { listing_title: leg.listing!.title, from_plan: plan.id, leg_title: leg.title },
        })),
      },
      status_history: {
        create: {
          to_status:  'CONFIRMED',
          created_by: session.user.id,
          note:       `Booked from trip plan: ${plan.title}`,
        },
      },
    },
  })

  return NextResponse.json({ booking_id: booking.id })
}
