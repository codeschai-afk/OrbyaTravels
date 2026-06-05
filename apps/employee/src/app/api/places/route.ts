import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  country_id:  z.string(),
  name:        z.string().min(2),
  slug:        z.string().min(2),
  description: z.string().optional(),
  category:    z.string(),
  city:        z.string().optional(),
  address:     z.string().optional(),
  latitude:    z.number(),
  longitude:   z.number(),
  is_active:   z.boolean().default(true),
  images:      z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({}, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { images, ...data } = body.data

  const place = await prisma.place.create({
    data: {
      ...data,
      category:   data.category as any,
      curated_by: session.user.id,
      images: {
        create: images.map((url, i) => ({ url, sort_order: i })),
      },
    },
  })

  return NextResponse.json({ data: place }, { status: 201 })
}
