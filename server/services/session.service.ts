import type { UserSession } from '#shared/types/user'
import { MAX_ACTIVE_SESSIONS_PER_USER } from '#shared/types/session'
import { and, desc, eq, gt, inArray, lt, ne } from 'drizzle-orm'
import { refreshTokens } from '../db/schema'
import { getDb } from '../utils/db'
import { hashToken } from '../utils/jwt'

const mapRow = (row: {
  id: string
  userAgent: string | null
  lastUsedAt: Date
  expiresAt: Date
}, current?: boolean): UserSession => ({
  id: row.id,
  userAgent: row.userAgent,
  lastActiveAt: row.lastUsedAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
  current: Boolean(current),
})

export const sessionService = {
  purgeExpiredForUser: async (userId: string) => {
    const db = getDb()
    await db.delete(refreshTokens).where(and(
      eq(refreshTokens.userId, userId),
      lt(refreshTokens.expiresAt, new Date()),
    ))
  },

  enforceSessionLimit: async (userId: string, keepSessionId?: string) => {
    const db = getDb()
    const rows = await db.select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        gt(refreshTokens.expiresAt, new Date()),
      ))
      .orderBy(desc(refreshTokens.lastUsedAt))

    const excess = rows.length - MAX_ACTIVE_SESSIONS_PER_USER

    if (excess <= 0) {
      return
    }

    const protectedId = keepSessionId
    const toRemove = rows
      .filter(row => row.id !== protectedId)
      .slice(-excess)
      .map(row => row.id)

    if (!toRemove.length) {
      return
    }

    await db.delete(refreshTokens).where(inArray(refreshTokens.id, toRemove))
  },

  maintainForUser: async (userId: string, keepSessionId?: string) => {
    await sessionService.purgeExpiredForUser(userId)
    await sessionService.enforceSessionLimit(userId, keepSessionId)
  },

  listForUser: async (userId: string, currentSessionId?: string): Promise<UserSession[]> => {
    await sessionService.maintainForUser(userId, currentSessionId)

    const db = getDb()
    const now = new Date()
    const rows = await db.select({
      id: refreshTokens.id,
      userAgent: refreshTokens.userAgent,
      lastUsedAt: refreshTokens.lastUsedAt,
      expiresAt: refreshTokens.expiresAt,
    })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        gt(refreshTokens.expiresAt, now),
      ))
      .orderBy(desc(refreshTokens.lastUsedAt))

    return rows.map(row => mapRow(row, row.id === currentSessionId))
  },

  resolveCurrentSessionId: async (userId: string, refreshToken?: string) => {
    if (!refreshToken) {
      return undefined
    }

    const db = getDb()
    const [row] = await db.select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tokenHash, hashToken(refreshToken)),
      ))
      .limit(1)

    return row?.id
  },

  revoke: async (userId: string, sessionId: string) => {
    const db = getDb()
    const [removed] = await db.delete(refreshTokens)
      .where(and(
        eq(refreshTokens.id, sessionId),
        eq(refreshTokens.userId, userId),
      ))
      .returning({ id: refreshTokens.id })

    if (!removed) {
      throw createError({ statusCode: 404, statusMessage: 'Session not found' })
    }
  },

  revokeOthers: async (userId: string, currentSessionId: string) => {
    const db = getDb()
    const result = await db.delete(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        ne(refreshTokens.id, currentSessionId),
      ))
      .returning({ id: refreshTokens.id })

    return { revoked: result.length }
  },
}
