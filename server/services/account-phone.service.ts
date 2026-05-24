import type { PhoneChangeStatus } from '#shared/types/account-phone'
import type { User } from '#shared/types/user'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../utils/db'
import { getRedis } from '../utils/redis'
import { otpDevExtras } from '../utils/dev-guards'
import { mapUser } from '../utils/auth'
import { maskPhoneForVerification, normalizePhone } from '#shared/utils/phone'
import { isPlaceholderPhone } from '#shared/utils/synthetic-phone-detect'
import { generateOtpCode, getOtpTtl } from '../utils/jwt'
import { emailService } from './email.service'
import { smsService } from './sms.service'

const CHANGE_PHONE_OLD_VERIFIED_TTL = 15 * 60

const changePhoneOtpKey = (userId: string, phone: string) => `otp:change-phone:${userId}:${normalizePhone(phone)}`
const changePhoneOldOtpKey = (userId: string) => `otp:change-phone-old:${userId}`
const changePhoneOldVerifiedKey = (userId: string) => `change-phone:old-verified:${userId}`

const requiresCurrentPhoneVerification = (phone: string) => !isPlaceholderPhone(phone)

const isEmailAuthEnabled = () => {
  const config = useRuntimeConfig()
  return Boolean(config.public.emailAuthEnabled || config.authDevCode || config.smtpUrl)
}

const assertPhoneChangeEnabled = () => {
  const config = useRuntimeConfig()

  if (!config.public.smsAuthEnabled && !isEmailAuthEnabled()) {
    throw createError({ statusCode: 403, statusMessage: 'Phone change is disabled' })
  }
}

const assertPhoneAvailable = async (phone: string, exceptUserId: string) => {
  const db = getDb()
  const normalizedPhone = normalizePhone(phone)
  const [other] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1)

  if (other && other.id !== exceptUserId) {
    throw createError({ statusCode: 409, statusMessage: 'Phone is already used by another account' })
  }
}

const getUserPhoneRow = async (userId: string) => {
  const db = getDb()
  const [userRow] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, userId)).limit(1)

  if (!userRow) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return userRow
}

const assertSmsChangeEnabled = () => {
  const config = useRuntimeConfig()

  if (!config.public.smsAuthEnabled) {
    throw createError({ statusCode: 403, statusMessage: 'Phone verification is disabled' })
  }
}

const getUserContactRow = async (userId: string) => {
  const db = getDb()
  const [userRow] = await db.select({
    phone: users.phone,
    email: users.email,
  }).from(users).where(eq(users.id, userId)).limit(1)

  if (!userRow) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return userRow
}

const assertOldPhoneVerified = async (userId: string, currentPhone: string) => {
  if (!requiresCurrentPhoneVerification(currentPhone)) {
    return
  }

  const redis = getRedis()
  const verified = await redis.get(changePhoneOldVerifiedKey(userId))

  if (!verified) {
    throw createError({ statusCode: 403, statusMessage: 'Current phone verification required' })
  }
}

export const accountPhoneService = {
  getChangeStatus: async (userId: string): Promise<PhoneChangeStatus> => {
    const { phone } = await getUserPhoneRow(userId)
    const requires = requiresCurrentPhoneVerification(phone)
    const redis = getRedis()
    const verified = requires
      ? Boolean(await redis.get(changePhoneOldVerifiedKey(userId)))
      : true

    return {
      requiresCurrentPhoneVerification: requires,
      currentPhoneVerified: verified,
      maskedCurrentPhone: requires ? maskPhoneForVerification(phone) : null,
    }
  },

  sendOldPhoneCode: async (userId: string) => {
    assertSmsChangeEnabled()

    const { phone } = await getUserPhoneRow(userId)

    if (!requiresCurrentPhoneVerification(phone)) {
      throw createError({ statusCode: 400, statusMessage: 'Current phone verification is not required' })
    }

    const code = generateOtpCode()
    const redis = getRedis()
    const config = useRuntimeConfig()

    await redis.set(changePhoneOldOtpKey(userId), code, 'EX', getOtpTtl())

    if (config.public.smsAuthEnabled) {
      await smsService.send({
        phone,
        message: `Golewood: код подтверждения текущего номера ${code}`,
        channel: 'auth',
      }).catch(() => undefined)
    }

    return {
      maskedPhone: maskPhoneForVerification(phone),
      expiresIn: getOtpTtl(),
      ...otpDevExtras(code, config.authDevCode),
    }
  },

  verifyOldPhoneCode: async (userId: string, code: string) => {
    const { phone } = await getUserPhoneRow(userId)

    if (!requiresCurrentPhoneVerification(phone)) {
      throw createError({ statusCode: 400, statusMessage: 'Current phone verification is not required' })
    }

    const redis = getRedis()
    const storedCode = await redis.get(changePhoneOldOtpKey(userId))

    if (!storedCode || storedCode !== code) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' })
    }

    await redis.del(changePhoneOldOtpKey(userId))
    await redis.set(changePhoneOldVerifiedKey(userId), '1', 'EX', CHANGE_PHONE_OLD_VERIFIED_TTL)

    return { verified: true as const, expiresIn: CHANGE_PHONE_OLD_VERIFIED_TTL }
  },

  sendChangeCode: async (userId: string, phone: string) => {
    assertPhoneChangeEnabled()

    const normalizedPhone = normalizePhone(phone)
    const db = getDb()
    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!userRow) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    await assertOldPhoneVerified(userId, userRow.phone)

    if (userRow.phone === normalizedPhone) {
      throw createError({ statusCode: 400, statusMessage: 'This is already your phone number' })
    }

    await assertPhoneAvailable(normalizedPhone, userId)

    const code = generateOtpCode()
    const redis = getRedis()
    const config = useRuntimeConfig()

    await redis.set(changePhoneOtpKey(userId, normalizedPhone), code, 'EX', getOtpTtl())

    if (config.public.smsAuthEnabled) {
      await smsService.send({
        phone: normalizedPhone,
        message: `Golewood: код смены телефона ${code}`,
        channel: 'auth',
      }).catch(() => undefined)
    } else {
      const contact = await getUserContactRow(userId)

      if (!contact.email) {
        throw createError({ statusCode: 400, statusMessage: 'Email is required to change phone' })
      }

      void emailService.send({
        to: contact.email,
        subject: 'Код смены телефона — Golewood',
        text: `Код для подтверждения нового номера ${normalizedPhone}: ${code}. Действует ${Math.floor(getOtpTtl() / 60)} мин.`,
      }).catch(() => undefined)
    }

    return {
      phone: normalizedPhone,
      expiresIn: getOtpTtl(),
      ...otpDevExtras(code, config.authDevCode),
    }
  },

  verifyChangeCode: async (userId: string, phone: string, code: string): Promise<User> => {
    const normalizedPhone = normalizePhone(phone)
    const redis = getRedis()
    const storedCode = await redis.get(changePhoneOtpKey(userId, normalizedPhone))

    if (!storedCode || storedCode !== code) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' })
    }

    await redis.del(changePhoneOtpKey(userId, normalizedPhone))
    await redis.del(changePhoneOldVerifiedKey(userId))
    await assertPhoneAvailable(normalizedPhone, userId)

    const db = getDb()
    const [updated] = await db.update(users)
      .set({ phone: normalizedPhone, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return mapUser(updated)
  },
}
