import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const legSchema = z.object({
  id:               z.string(),
  order:            z.number(),
  type:             z.string(),
  title:            z.string(),
  description:      z.string().optional(),
  duration_minutes: z.number().nullable().optional(),
  tip:              z.string().nullable().optional(),
  listing_id:       z.string().nullable().optional(),
})

const daySchema = z.object({
  id:    z.string(),
  title: z.string().optional(),
  notes: z.string().optional(),
  legs:  z.array(legSchema),
})

const schema = z.object({
  days: z.array(daySchema),
})

export async function PATCH(req: NextRequest, { params }: { params: { planId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = await prisma.tripPlan.findUnique({
    where: { id: params.planId, user_id: session.user.id },
  })
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  // Update each day and its legs in a transaction
  await prisma.$transaction(
    body.data.days.flatMap((day) => [
      prisma.tripPlanDay.update({
        where: { id: day.id },
        data: { title: day.title, notes: day.notes },
      }),
      ...day.legs.map((leg) =>
        prisma.tripPlanLeg.update({
          where: { id: leg.id },
          data: {
            order:            leg.order,
            type:             leg.type as any,
            title:            leg.title,
            description:      leg.description ?? null,
            duration_minutes: leg.duration_minutes ?? null,
            tip:              leg.tip ?? null,
            listing_id:       leg.listing_id ?? null,
          },
        })
      ),
    ])
  )

  return NextResponse.json({ ok: true })
}
