import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED:   ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
}

const schema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  note:   z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) return NextResponse.json({ error: 'No provider profile' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { status: newStatus, note } = parsed.data

  const booking = await prisma.booking.findFirst({
    where: {
      id:    params.id,
      items: { some: { listing: { provider_id: profile.id } } },
    },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const allowed = ALLOWED_TRANSITIONS[booking.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({ error: `Cannot transition from ${booking.status} to ${newStatus}` }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data:  { status: newStatus },
    }),
    prisma.bookingStatusEvent.create({
      data: {
        booking_id:   booking.id,
        from_status:  booking.status,
        to_status:    newStatus,
        note:         note ?? null,
        created_by:   session.user.id,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
