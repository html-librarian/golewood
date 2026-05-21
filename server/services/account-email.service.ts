import type { User } from '#shared/types/user'
import { and, eq, ne, sql } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../utils/db'
import { getRedis } from '../utils/redis'
import { mapUser } from '../utils/auth'
import { normalizeEmail } from '#shared/utils/email'
import { generateOtpCode, getOtpTtl } from '../utils/jwt'
import { buildEmailMagicUrl } from '../utils/magic-link'
import { emailService } from './email.service'
import { otpDevExtras } from '../utils/dev-guards'

const linkOtpKey = (userId: string, email: string) => `otp:account-email:${userId}:${normalizeEmail(email)}`

export const assertEmailAvailable = async (email: string, exceptUserId?: string) => {
  const db = getDb()
  const normalized = normalizeEmail(email)
  const conditions = [sql`lower(${users.email}) = ${normalized}`]

  if (exceptUserId) {
    conditions.push(ne(users.id, exceptUserId))
  }

  const [other] = await db.select({ id: users.id })
    .from(users)
    .where(and(...conditions))
    .limit(1)

  if (other) {
    throw createError({ statusCode: 409, statusMessage: 'Email is already used by another account' })
  }
}

export const accountEmailService = {
  sendLinkCode: async (userId: string, email: string) => {
    const config = useRuntimeConfig()
    const normalizedEmail = normalizeEmail(email)
    const db = getDb()
    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!userRow) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    if (userRow.email && normalizeEmail(userRow.email) === normalizedEmail) {
      return { email: normalizedEmail, expiresIn: getOtpTtl() }
    }

    await assertEmailAvailable(normalizedEmail, userId)

    const code = generateOtpCode()
    const redis = getRedis()

    await redis.set(linkOtpKey(userId, normalizedEmail), code, 'EX', getOtpTtl())

    const magicUrl = await buildEmailMagicUrl({
      purpose: 'account-email',
      email: normalizedEmail,
      sub: userId,
    })

    await emailService.send({
      to: normalizedEmail,
      subject: 'Подтверждение email — Golewood',
      text: [
        `Код для привязки email к аккаунту: ${code}. Действует ${Math.floor(getOtpTtl() / 60)} мин.`,
        `Или подтвердите по ссылке: ${magicUrl}`,
      ].join('\n\n'),
    }).catch(() => undefined)

    return {
      email: normalizedEmail,
      expiresIn: getOtpTtl(),
      ...otpDevExtras(code, config.authDevCode, { devMagicUrl: magicUrl }),
    }
  },

  applyEmailMagic: async (userId: string, email: string): Promise<User> => {
    const normalizedEmail = normalizeEmail(email)
    await assertEmailAvailable(normalizedEmail, userId)

    const db = getDb()
    const [updated] = await db.update(users)
      .set({ email: normalizedEmail, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return mapUser(updated)
  },

  verifyLinkCode: async (userId: string, email: string, code: string): Promise<User> => {
    const normalizedEmail = normalizeEmail(email)
    const redis = getRedis()
    const storedCode = await redis.get(linkOtpKey(userId, normalizedEmail))

    if (!storedCode || storedCode !== code) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' })
    }

    await redis.del(linkOtpKey(userId, normalizedEmail))
    await assertEmailAvailable(normalizedEmail, userId)

    const db = getDb()
    const [updated] = await db.update(users)
      .set({ email: normalizedEmail, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return mapUser(updated)
  },

  unlink: async (userId: string): Promise<User> => {
    const db = getDb()
    const [updated] = await db.update(users)
      .set({ email: null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return mapUser(updated)
  },
}
