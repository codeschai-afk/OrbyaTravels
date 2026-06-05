import { PrismaClient } from '../generated/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function makePrisma() {
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Lazy proxy — the real PrismaClient is created on first property access,
// by which time Next.js has loaded .env.local into process.env.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = makePrisma()
    }
    const val = (globalForPrisma.prisma as any)[prop]
    return typeof val === 'function' ? val.bind(globalForPrisma.prisma) : val
  },
})

export * from '../generated/client'
