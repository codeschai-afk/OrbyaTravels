import { Hono } from 'hono'
import { prisma } from '@orbyatravel/db'

export const listings = new Hono()

listings.get('/', async (c) => {
  const { country, type, page = '1', per_page = '20' } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

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
    meta: {
      page: parseInt(page),
      per_page: take,
      total,
      total_pages: Math.ceil(total / take),
    },
  })
})

listings.get('/:id', async (c) => {
  const id = c.req.param('id')
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sort_order: 'asc' } },
      country: true,
      accommodation: { include: { room_types: true } },
      flight: { include: { schedules: true } },
      bus: true,
      train: true,
      car_rental: true,
      reviews: { include: { user: { select: { name: true, avatar_url: true } } } },
    },
  })

  if (!listing || listing.approval_status !== 'APPROVED' || !listing.is_active) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  }

  return c.json({ data: listing })
})
