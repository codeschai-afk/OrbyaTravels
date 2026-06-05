import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  place_id: z.string(),
  action:   z.enum(['add', 'remove']),
  notes:    z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const { place_id, action, notes } = body.data

  if (action === 'add') {
    await prisma.bucketListItem.upsert({
      where:  { user_id_place_id: { user_id: session.user.id, place_id } },
      create: { user_id: session.user.id, place_id, notes },
      update: { notes },
    })
  } else {
    await prisma.bucketListItem.deleteMany({
      where: { user_id: session.user.id, place_id },
    })
  }

  return NextResponse.json({ ok: true })
}
