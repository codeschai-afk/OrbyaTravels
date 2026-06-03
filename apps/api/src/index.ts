import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { v1 } from './routes/v1'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://orbyatravel.com',
      'https://provider.orbyatravel.com',
      'https://staff.orbyatravel.com',
      'https://admin.orbyatravel.com',
    ],
    credentials: true,
  })
)
app.use('*', prettyJSON())

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/v1', v1)

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    500
  )
})

const port = parseInt(process.env.PORT ?? '4000')

serve({ fetch: app.fetch, port }, () => {
  console.warn(`API running on http://localhost:${port}`)
})

export type AppType = typeof app
