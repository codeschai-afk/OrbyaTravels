import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  country_id:  z.string().optional(),
  name:        z.string().min(2).optional(),
  slug:        z.string().min(2).optional(),
  description: z.string().optional(),
  category:    z.string().optional(),
  city:        z.string().optional(),
  address:     z.string().optional(),
  latitude:    z.number().optional(),
  longitude:   z.number().optional(),
  is_active:   z.boolean().optional(),
  images:      z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({}, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { images, category, ...rest } = body.data

  const place = await prisma.place.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(category ? { category: category as any } : {}),
      ...(images !== undefined ? {
        images: {
          deleteMany: {},
          create: images.map((url, i) => ({ url, sort_order: i })),
        },
      } : {}),
    },
  })

  return NextResponse.json({ data: place })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({}, { status: 401 })

  await prisma.place.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
