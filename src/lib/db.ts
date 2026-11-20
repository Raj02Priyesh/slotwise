import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// One client per process (and across hot reloads in development).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function client(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  }
  return globalForPrisma.prisma
}

/** Created on first use, so `next build` works without a database. */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const c = client()
    const value = Reflect.get(c, prop, c)
    return typeof value === 'function' ? value.bind(c) : value
  },
})
