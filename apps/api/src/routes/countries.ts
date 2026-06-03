import { Hono } from 'hono'
import { prisma } from '@orbyatravel/db'

export const countries = new Hono()

countries.get('/', async (c) => {
  const { active, featured } = c.req.query()

  const rows = await prisma.country.findMany({
    where: {
      ...(active === 'true' && { is_active: true }),
      ...(featured === 'true' && { is_featured: true }),
    },
    include: { hero_images: { orderBy: { sort_order: 'asc' } } },
    orderBy: { name: 'asc' },
  })

  return c.json({ data: rows })
})

countries.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const country = await prisma.country.findUnique({
    where: { slug },
    include: { hero_images: { orderBy: { sort_order: 'asc' } } },
  })

  if (!country) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Country not found' } }, 404)
  }

  return c.json({ data: country })
})
