import { Hono } from 'hono'
import { prisma } from '@orbyatravel/db'

export const bookings = new Hono()

// Placeholder — auth middleware and full CRUD to be added in Phase 2
bookings.get('/health', (c) => c.json({ data: 'bookings route ok' }))
