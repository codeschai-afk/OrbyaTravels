import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'

describe('API response shape', () => {
  it('success response has data key', async () => {
    const app = new Hono()
    app.get('/test', (c) => c.json({ data: { id: '1', name: 'test' } }))

    const res = await app.request('/test')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveProperty('data')
    expect(json.data).toMatchObject({ id: '1', name: 'test' })
  })

  it('error response has error.code and error.message', async () => {
    const app = new Hono()
    app.get('/test', (c) =>
      c.json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } }, 404)
    )

    const res = await app.request('/test')
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toHaveProperty('code', 'NOT_FOUND')
    expect(json.error).toHaveProperty('message')
  })

  it('paginated response has data array and meta', async () => {
    const app = new Hono()
    app.get('/test', (c) =>
      c.json({
        data: [{ id: '1' }, { id: '2' }],
        meta: { page: 1, per_page: 20, total: 2, total_pages: 1 },
      })
    )

    const res = await app.request('/test')
    const json = await res.json()

    expect(Array.isArray(json.data)).toBe(true)
    expect(json.meta).toMatchObject({ page: 1, total: 2 })
  })

  it('health endpoint returns ok', async () => {
    const app = new Hono()
    app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

    const res = await app.request('/health')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
    expect(json.timestamp).toBeDefined()
  })
})
