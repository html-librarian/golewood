import type { H3Event } from 'h3'
import type { User } from '#shared/types/user'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { verifyToken } from '../utils/jwt'

export const mapUser = (row: typeof users.$inferSelect): User => ({
  id: row.id,
  phone: row.phone,
  email: row.email,
  name: row.name,
  lastName: row.lastName,
  firstName: row.firstName,
  patronymic: row.patronymic,
  role: row.role,
  bonusBalance: row.bonusBalance,
  maxUserId: row.maxUserId ?? null,
  maxLinkedAt: row.maxLinkedAt?.toISOString() ?? null,
  twoFactorEnabled: row.twoFactorEnabled,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const getAuthUser = (event: H3Event) => event.context.auth?.user as User | undefined

export const requireAuth = (event: H3Event) => {
  const user = getAuthUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return user
}

export const requireRole = (event: H3Event, roles: User['role'][]) => {
  const user = requireAuth(event)

  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return user
}

export const resolveUserFromToken = async (token: string) => {
  const payload = await verifyToken<{ sub: string, role: string }>(token)
  const db = getDb()
  const [row] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1)

  if (!row) {
    return null
  }

  return mapUser(row)
}
