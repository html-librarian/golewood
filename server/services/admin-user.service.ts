import type { User } from '#shared/types/user'
import { desc, eq, sql } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../utils/db'
import { mapUser } from '../utils/auth'
import { normalizePhone } from '#shared/utils/phone'

export const adminUserService = {
  findByPhone: async (phone: string): Promise<User | null> => {
    const db = getDb()
    const normalizedPhone = normalizePhone(phone)
    const [row] = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1)

    return row ? mapUser(row) : null
  },

  list: async (): Promise<User[]> => {
    const db = getDb()
    const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(100)
    return rows.map(mapUser)
  },

  updateRole: async (
    userId: string,
    role: User['role'],
    actorId: string,
    actorRole: User['role'],
  ): Promise<User> => {
    const db = getDb()

    if (actorRole !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Only admins can change user roles' })
    }

    if (userId === actorId) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot change your own role' })
    }

    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!target) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    if (target.role === 'admin' && role !== 'admin') {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'admin'))

      if (count <= 1) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot remove the last admin' })
      }
    }

    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    return mapUser(updated)
  },
}
