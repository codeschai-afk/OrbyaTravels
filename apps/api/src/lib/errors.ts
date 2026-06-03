import type { Context } from 'hono'

export const notFound = (c: Context, message = 'Not found') =>
  c.json({ error: { code: 'NOT_FOUND', message } }, 404)

export const badRequest = (c: Context, message: string, details?: unknown) =>
  c.json({ error: { code: 'BAD_REQUEST', message, details } }, 400)

export const forbidden = (c: Context, message = 'Forbidden') =>
  c.json({ error: { code: 'FORBIDDEN', message } }, 403)

export const conflict = (c: Context, message: string) =>
  c.json({ error: { code: 'CONFLICT', message } }, 409)

export const serverError = (c: Context) =>
  c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
