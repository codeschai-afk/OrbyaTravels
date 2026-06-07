import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const legSchema = z.object({
  order:            z.number(),
  type:             z.enum(['PLACE', 'TRANSPORT', 'ACCOMMODATION']),
  title:            z.string().min(1),
  description:      z.string().default(''),
  duration_minutes: z.number().nullable().optional(),
  tip:              z.string().nullable().optional(),
  listing_id:       z.string().nullable().optional(),
  place_id:         z.string().nullable().optional(),
})

const daySchema = z.object({
  day_number: z.number().int().min(1),
  title:      z.string().min(1),
  notes:      z.string().default(''),
  legs:       z.array(legSchema),
})

const schema = z.object({
  country_id:    z.string(),
  title:         z.string().min(1).max(120),
  duration_days: z.number().int().min(1).max(30),
  travel_style:  z.enum(['BUDGET', 'COMFORT', 'LUXURY']),
  days:          z.array(daySchema),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to save a plan' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid plan data' }, { status: 400 })

  const { country_id, title, duration_days, travel_style, days } = body.data

  const country = await prisma.country.findUnique({ where: { id: country_id }, select: { id: true } })
  if (!country) return NextResponse.json({ error: 'Country not found' }, { status: 404 })

  const plan = await prisma.tripPlan.create({
    data: {
      user_id:      session.user.id,
      country_id:   country.id,
      title,
      duration_days,
      travel_style,
      raw_response: undefined,
      days: {
        create: days.map((day) => ({
          day_number: day.day_number,
          title:      day.title,
          notes:      day.notes,
          legs: {
            create: day.legs.map((leg) => ({
              order:            leg.order,
              type:             leg.type,
              title:            leg.title,
              description:      leg.description,
              duration_minutes: leg.duration_minutes ?? null,
              tip:              leg.tip ?? null,
              listing_id:       leg.listing_id ?? null,
              place_id:         leg.place_id ?? null,
            })),
          },
        })),
      },
    },
  })

  return NextResponse.json({ plan_id: plan.id })
}
