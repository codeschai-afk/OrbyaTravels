import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@orbyatravel/db'
import { generateSlug } from '../lib/slug'
import { notFound, badRequest, conflict, serverError } from '../lib/errors'

export const listings = new Hono()

// ── GET /v1/listings ─────────────────────────────────────────────────────────
listings.get('/', async (c) => {
  const { country, type, page = '1', per_page = '20' } = c.req.query()
  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = Math.min(parseInt(per_page), 100)

  const where = {
    approval_status: 'APPROVED' as const,
    is_active: true,
    ...(country && { country: { slug: country } }),
    ...(type && { type: type as never }),
  }

  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { images: { orderBy: { sort_order: 'asc' }, take: 1 }, country: true },
      skip,
      take,
      orderBy: { created_at: 'desc' },
    }),
    prisma.listing.count({ where }),
  ])

  return c.json({
    data: rows,
    meta: { page: parseInt(page), per_page: take, total, total_pages: Math.ceil(total / take) },
  })
})

// ── GET /v1/listings/:type/:slug ─────────────────────────────────────────────
listings.get('/:type/:slug', async (c) => {
  const { type, slug } = c.req.param()

  const listing = await prisma.listing.findFirst({
    where: { slug, type: type.toUpperCase() as never, approval_status: 'APPROVED', is_active: true },
    include: {
      images: { orderBy: { sort_order: 'asc' } },
      country: true,
      accommodation: { include: { room_types: true } },
      flight: { include: { schedules: { where: { is_active: true }, orderBy: { departure_at: 'asc' } } } },
      bus: true,
      train: true,
      car_rental: true,
      reviews: {
        include: { user: { select: { name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
        take: 10,
      },
    },
  })

  if (!listing) return notFound(c, 'Listing not found')
  return c.json({ data: listing })
})

// ── POST /v1/listings ────────────────────────────────────────────────────────
const createSchema = z.object({
  provider_id: z.string().cuid(),
  country_id: z.string().cuid(),
  type: z.enum(['ACCOMMODATION', 'FLIGHT', 'BUS', 'TRAIN', 'CAR_RENTAL']),
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  base_price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
})

listings.post('/', zValidator('json', createSchema), async (c) => {
  const body = c.req.valid('json')

  // Generate a unique slug (retry on collision, max 3 attempts)
  let slug = ''
  for (let i = 0; i < 3; i++) {
    const candidate = generateSlug(body.title)
    const exists = await prisma.listing.findFirst({ where: { slug: candidate, type: body.type } })
    if (!exists) { slug = candidate; break }
  }
  if (!slug) return serverError(c)

  try {
    const listing = await prisma.listing.create({
      data: { ...body, slug, base_price: body.base_price },
    })
    return c.json({ data: listing }, 201)
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') return conflict(c, 'Slug already exists for this listing type')
    return serverError(c)
  }
})

// ── PATCH /v1/listings/:id ───────────────────────────────────────────────────
const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).optional(),
  base_price: z.number().positive().optional(),
  is_active: z.boolean().optional(),
})

listings.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const existing = await prisma.listing.findUnique({ where: { id } })
  if (!existing) return notFound(c, 'Listing not found')

  const updated = await prisma.listing.update({ where: { id }, data: body })
  return c.json({ data: updated })
})

// ── DELETE /v1/listings/:id ──────────────────────────────────────────────────
listings.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await prisma.listing.findUnique({ where: { id } })
  if (!existing) return notFound(c, 'Listing not found')

  await prisma.listing.update({ where: { id }, data: { is_active: false } })
  return c.json({ data: { id, deactivated: true } })
})
