import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await prisma.booking.findUnique({
    where: { id: params.id, customer_id: session.user.id },
  })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (booking.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'Only confirmed bookings can be cancelled' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data:  { status: 'CANCELLED' },
    }),
    prisma.bookingStatusEvent.create({
      data: {
        booking_id:  booking.id,
        from_status: 'CONFIRMED',
        to_status:   'CANCELLED',
        created_by:  session.user.id,
        note:        'Cancelled by customer',
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
