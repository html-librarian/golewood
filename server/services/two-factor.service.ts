import type { MfaChallenge, TwoFactorStatus } from '#shared/types/two-factor'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { users } from '../db/schema'
import { getDb } from '../utils/db'
import { getRedis } from '../utils/redis'
import { maskEmailForVerification, normalizeEmail } from '#shared/utils/email'
import { generateOtpCode, getOtpTtl } from '../utils/jwt'
import { emailService } from './email.service'
import { otpDevExtras } from '../utils/dev-guards'

const MFA_CHALLENGE_TTL = 600

const enableOtpKey = (userId: string) => `otp:2fa-enable:${userId}`
const disableOtpKey = (userId: string) => `otp:2fa-disable:${userId}`
const mfaChallengeKey = (token: string) => `mfa:challenge:${token}`
const mfaOtpKey = (challengeToken: string) => `otp:mfa:${challengeToken}`

const getUserRow = async (userId: string) => {
  const db = getDb()
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return row
}

const assertUserEmail = (row: typeof users.$inferSelect) => {
  if (!row.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Link an email in account settings before using two-factor authentication',
    })
  }

  return normalizeEmail(row.email)
}

const sendEmailOtp = async (email: string, redisKey: string, subject: string, bodyPrefix: string) => {
  const code = generateOtpCode()
  const redis = getRedis()
  const config = useRuntimeConfig()

  await redis.set(redisKey, code, 'EX', getOtpTtl())

  await emailService.send({
    to: email,
    subject,
    text: `${bodyPrefix} ${code}. Действует ${Math.floor(getOtpTtl() / 60)} мин.`,
  }).catch(() => undefined)

  return {
    expiresIn: getOtpTtl(),
    ...otpDevExtras(code, config.authDevCode),
  }
}

const verifyEmailOtp = async (redisKey: string, code: string) => {
  const redis = getRedis()
  const storedCode = await redis.get(redisKey)

  if (!storedCode || storedCode !== code) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' })
  }

  await redis.del(redisKey)
}

export const twoFactorService = {
  getStatus: async (userId: string): Promise<TwoFactorStatus> => {
    const row = await getUserRow(userId)
    const email = row.email ? normalizeEmail(row.email) : null

    return {
      enabled: row.twoFactorEnabled,
      canEnable: Boolean(email),
      maskedEmail: email ? maskEmailForVerification(email) : null,
    }
  },

  sendEnableCode: async (userId: string) => {
    const row = await getUserRow(userId)
    const email = assertUserEmail(row)

    if (row.twoFactorEnabled) {
      throw createError({ statusCode: 400, statusMessage: 'Two-factor authentication is already enabled' })
    }

    const result = await sendEmailOtp(
      email,
      enableOtpKey(userId),
      'Включение 2FA — Golewood',
      'Код для включения двухфакторной аутентификации:',
    )

    return {
      maskedEmail: maskEmailForVerification(email),
      ...result,
    }
  },

  confirmEnable: async (userId: string, code: string) => {
    const row = await getUserRow(userId)
    assertUserEmail(row)

    await verifyEmailOtp(enableOtpKey(userId), code)

    const db = getDb()
    const [updated] = await db.update(users)
      .set({ twoFactorEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return twoFactorService.getStatus(userId)
  },

  sendDisableCode: async (userId: string) => {
    const row = await getUserRow(userId)

    if (!row.twoFactorEnabled) {
      throw createError({ statusCode: 400, statusMessage: 'Two-factor authentication is not enabled' })
    }

    const email = assertUserEmail(row)
    const result = await sendEmailOtp(
      email,
      disableOtpKey(userId),
      'Отключение 2FA — Golewood',
      'Код для отключения двухфакторной аутентификации:',
    )

    return {
      maskedEmail: maskEmailForVerification(email),
      ...result,
    }
  },

  confirmDisable: async (userId: string, code: string) => {
    const row = await getUserRow(userId)

    if (!row.twoFactorEnabled) {
      throw createError({ statusCode: 400, statusMessage: 'Two-factor authentication is not enabled' })
    }

    assertUserEmail(row)
    await verifyEmailOtp(disableOtpKey(userId), code)

    const db = getDb()
    await db.update(users)
      .set({ twoFactorEnabled: false, updatedAt: new Date() })
      .where(eq(users.id, userId))

    return twoFactorService.getStatus(userId)
  },

  beginLoginChallenge: async (userId: string): Promise<MfaChallenge> => {
    const row = await getUserRow(userId)

    if (!row.twoFactorEnabled) {
      throw createError({ statusCode: 400, statusMessage: 'Two-factor authentication is not enabled' })
    }

    const email = assertUserEmail(row)
    const challengeToken = randomBytes(24).toString('hex')
    const redis = getRedis()
    const config = useRuntimeConfig()
    const code = generateOtpCode()

    await redis.set(mfaChallengeKey(challengeToken), userId, 'EX', MFA_CHALLENGE_TTL)
    await redis.set(mfaOtpKey(challengeToken), code, 'EX', getOtpTtl())

    await emailService.send({
      to: email,
      subject: 'Код входа — Golewood',
      text: `Дополнительный код для входа: ${code}. Действует ${Math.floor(getOtpTtl() / 60)} мин.`,
    }).catch(() => undefined)

    return {
      mfaRequired: true,
      challengeToken,
      maskedEmail: maskEmailForVerification(email),
      expiresIn: getOtpTtl(),
      ...otpDevExtras(code, config.authDevCode),
    }
  },

  resendLoginChallenge: async (challengeToken: string): Promise<MfaChallenge> => {
    const redis = getRedis()
    const userId = await redis.get(mfaChallengeKey(challengeToken))

    if (!userId) {
      throw createError({ statusCode: 400, statusMessage: 'Login challenge expired — sign in again' })
    }

    const row = await getUserRow(userId)
    const email = assertUserEmail(row)
    const config = useRuntimeConfig()
    const code = generateOtpCode()

    await redis.set(mfaOtpKey(challengeToken), code, 'EX', getOtpTtl())
    await redis.expire(mfaChallengeKey(challengeToken), MFA_CHALLENGE_TTL)

    await emailService.send({
      to: email,
      subject: 'Код входа — Golewood',
      text: `Дополнительный код для входа: ${code}. Действует ${Math.floor(getOtpTtl() / 60)} мин.`,
    }).catch(() => undefined)

    return {
      mfaRequired: true,
      challengeToken,
      maskedEmail: maskEmailForVerification(email),
      expiresIn: getOtpTtl(),
      ...otpDevExtras(code, config.authDevCode),
    }
  },

  verifyLoginChallenge: async (challengeToken: string, code: string) => {
    const redis = getRedis()
    const userId = await redis.get(mfaChallengeKey(challengeToken))
    const storedCode = await redis.get(mfaOtpKey(challengeToken))

    if (!userId || !storedCode || storedCode !== code) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' })
    }

    await redis.del(mfaChallengeKey(challengeToken))
    await redis.del(mfaOtpKey(challengeToken))

    return getUserRow(userId)
  },

  shouldChallengeLogin: (row: typeof users.$inferSelect) =>
    row.twoFactorEnabled && Boolean(row.email),
}
