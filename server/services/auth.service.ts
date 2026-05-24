import type { AuthSession, AuthTokens, User } from '#shared/types/user'
import type { LoginResult } from '#shared/types/two-factor'
import type {
  SendCodeInput,
  SendEmailCodeInput,
  VerifyCodeInput,
  VerifyEmailCodeInput,
  RefreshTokenInput,
} from '#shared/schemas/auth'
import type { SessionClientMeta } from '#shared/types/session'
import { eq, sql } from 'drizzle-orm'
import { refreshTokens, users } from '../db/schema'
import { getDb } from '../utils/db'
import { getRedis } from '../utils/redis'
import {
  createAccessToken,
  createRefreshToken,
  generateOtpCode,
  getOtpTtl,
  getRefreshTokenExpiresAt,
  hashToken,
  verifyToken,
} from '../utils/jwt'
import { mapUser } from '../utils/auth'
import { assertAuthNameProvided, resolveAuthNameColumns, type AuthNameInput } from './auth-name'
import { normalizeEmail } from '#shared/utils/email'
import { normalizePhone } from '#shared/utils/phone'
import { assertEmailAvailable } from './account-email.service'
import { buildEmailMagicUrl, type EmailMagicPayload } from '../utils/magic-link'
import { emailService } from './email.service'
import { smsService } from './sms.service'
import { twoFactorService } from './two-factor.service'
import { sessionService } from './session.service'
import { otpDevExtras } from '../utils/dev-guards'

const otpKey = (phone: string) => `otp:${phone}`
const emailOtpKey = (email: string) => `otp:email:${email}`

const isEmailAuthEnabled = () => {
  const config = useRuntimeConfig()
  return Boolean(config.public.emailAuthEnabled || config.authDevCode || config.smtpUrl)
}

const findUserByEmail = async (email: string) => {
  const db = getDb()
  const normalized = normalizeEmail(email)
  const [row] = await db.select().from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1)

  return row ?? null
}

const assertPhoneAvailableForSignup = async (phone: string) => {
  const db = getDb()
  const normalizedPhone = normalizePhone(phone)
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.phone, normalizedPhone)).limit(1)

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Phone is already used by another account' })
  }
}

const applyNameIfMissing = (
  userRow: typeof users.$inferSelect,
  input: AuthNameInput,
): Partial<typeof users.$inferInsert> | null => {
  if (userRow.lastName || userRow.name) {
    return null
  }

  return resolveAuthNameColumns(input)
}

const completeEmailLogin = async (
  normalizedEmail: string,
  options?: AuthNameInput & { linkPhone?: string, phone?: string },
): Promise<typeof users.$inferSelect> => {
  const db = getDb()
  let userRow = await findUserByEmail(normalizedEmail)

  if (!userRow && options?.linkPhone) {
    const normalizedPhone = normalizePhone(options.linkPhone)
    const [phoneUser] = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1)

    if (phoneUser) {
      if (phoneUser.email) {
        throw createError({
          statusCode: 409,
          statusMessage: 'This phone account already has an email — sign in with that email',
        })
      }

      await assertEmailAvailable(normalizedEmail, phoneUser.id)

      const patch: Partial<typeof users.$inferInsert> = {
        email: normalizedEmail,
        updatedAt: new Date(),
      }

      const nameCols = options ? applyNameIfMissing(phoneUser, options) : null

      if (nameCols) {
        Object.assign(patch, nameCols)
      }

      const [updated] = await db.update(users)
        .set(patch)
        .where(eq(users.id, phoneUser.id))
        .returning()

      userRow = updated
    }
  }

  if (!userRow) {
    await assertEmailAvailable(normalizedEmail)

    if (!options?.phone) {
      throw createError({ statusCode: 400, statusMessage: 'Phone is required' })
    }

    assertAuthNameProvided(options)
    const nameCols = resolveAuthNameColumns(options)!

    const normalizedPhone = normalizePhone(options.phone)
    await assertPhoneAvailableForSignup(normalizedPhone)

    const [createdUser] = await db.insert(users).values({
      phone: normalizedPhone,
      email: normalizedEmail,
      ...nameCols,
      role: 'guest',
    }).returning()

    userRow = createdUser
  } else if (options) {
    const nameCols = applyNameIfMissing(userRow, options)

    if (nameCols) {
      const [updatedUser] = await db.update(users)
        .set({ ...nameCols, updatedAt: new Date() })
        .where(eq(users.id, userRow.id))
        .returning()

      userRow = updatedUser
    }
  } else if (!userRow.email) {
    const [updatedUser] = await db.update(users)
      .set({ email: normalizedEmail, updatedAt: new Date() })
      .where(eq(users.id, userRow.id))
      .returning()

    userRow = updatedUser
  }

  return userRow
}

const buildAuthSession = async (
  userRow: typeof users.$inferSelect,
  meta?: SessionClientMeta,
): Promise<AuthSession> => {
  const tokens = await authService.issueTokens(userRow, meta)

  return {
    ...tokens,
    user: mapUser(userRow),
  }
}

export const authService = {
  completeLogin: async (userRow: typeof users.$inferSelect, meta?: SessionClientMeta): Promise<LoginResult> => {
    if (twoFactorService.shouldChallengeLogin(userRow)) {
      return twoFactorService.beginLoginChallenge(userRow.id)
    }

    return buildAuthSession(userRow, meta)
  },
  sendCode: async ({ phone }: SendCodeInput) => {
    const config = useRuntimeConfig()

    if (!config.public.smsAuthEnabled) {
      throw createError({ statusCode: 403, statusMessage: 'Phone sign-in is disabled' })
    }

    const normalizedPhone = normalizePhone(phone)
    const code = generateOtpCode()
    const redis = getRedis()

    await redis.set(otpKey(normalizedPhone), code, 'EX', getOtpTtl())

    if (config.public.smsAuthEnabled) {
      await smsService.send({
        phone: normalizedPhone,
        message: `Golewood: ваш код ${code}`,
        channel: 'auth',
      }).catch(() => undefined)
    }

    return {
      phone: normalizedPhone,
      expiresIn: getOtpTtl(),
      ...otpDevExtras(code, config.authDevCode),
    }
  },

  verifyCode: async ({ phone, code, lastName, firstName, patronymic }: VerifyCodeInput, meta?: SessionClientMeta): Promise<LoginResult> => {
    const normalizedPhone = normalizePhone(phone)
    const redis = getRedis()
    const storedCode = await redis.get(otpKey(normalizedPhone))

    if (!storedCode || storedCode !== code) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' })
    }

    await redis.del(otpKey(normalizedPhone))

    const db = getDb()
    const [existingUser] = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1)

    let userRow = existingUser

    if (!userRow) {
      const nameInput = { lastName, firstName, patronymic }
      assertAuthNameProvided(nameInput)
      const nameCols = resolveAuthNameColumns(nameInput)!

      const [createdUser] = await db.insert(users).values({
        phone: normalizedPhone,
        ...nameCols,
        role: 'guest',
      }).returning()

      userRow = createdUser
    } else {
      const nameCols = applyNameIfMissing(userRow, { lastName, firstName, patronymic })

      if (nameCols) {
        const [updatedUser] = await db.update(users)
          .set({ ...nameCols, updatedAt: new Date() })
          .where(eq(users.id, userRow.id))
          .returning()

        userRow = updatedUser
      }
    }

    return authService.completeLogin(userRow, meta)
  },

  sendEmailCode: async ({ email }: SendEmailCodeInput) => {
    if (!isEmailAuthEnabled()) {
      throw createError({ statusCode: 403, statusMessage: 'Email sign-in is disabled' })
    }

    const config = useRuntimeConfig()
    const normalizedEmail = normalizeEmail(email)
    const code = generateOtpCode()
    const redis = getRedis()

    await redis.set(emailOtpKey(normalizedEmail), code, 'EX', getOtpTtl())

    const magicUrl = await buildEmailMagicUrl({
      purpose: 'email-login',
      email: normalizedEmail,
    })

    void emailService.send({
      to: normalizedEmail,
      subject: 'Код входа — Golewood',
      text: [
        `Ваш код для входа: ${code}. Действует ${Math.floor(getOtpTtl() / 60)} мин.`,
        `Или перейдите по ссылке: ${magicUrl}`,
      ].join('\n\n'),
    }).catch(() => undefined)

    return {
      email: normalizedEmail,
      expiresIn: getOtpTtl(),
      ...otpDevExtras(code, config.authDevCode, { devMagicUrl: magicUrl }),
    }
  },

  verifyEmailCode: async (
    { email, code, lastName, firstName, patronymic, phone, linkPhone }: VerifyEmailCodeInput,
    meta?: SessionClientMeta,
  ): Promise<LoginResult> => {
    const normalizedEmail = normalizeEmail(email)
    const redis = getRedis()
    const storedCode = await redis.get(emailOtpKey(normalizedEmail))

    if (!storedCode || storedCode !== code) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' })
    }

    await redis.del(emailOtpKey(normalizedEmail))

    const userRow = await completeEmailLogin(normalizedEmail, {
      lastName,
      firstName,
      patronymic,
      phone,
      linkPhone,
    })
    return authService.completeLogin(userRow, meta)
  },

  verifyEmailMagic: async (
    payload: EmailMagicPayload,
    options?: AuthNameInput & { linkPhone?: string, phone?: string },
    meta?: SessionClientMeta,
  ): Promise<LoginResult> => {
    if (payload.purpose !== 'email-login') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid magic link' })
    }

    const userRow = await completeEmailLogin(payload.email, {
      ...options,
      name: options?.name ?? payload.name,
      linkPhone: options?.linkPhone,
      phone: options?.phone,
    })

    return authService.completeLogin(userRow, meta)
  },

  issueTokens: async (userRow: typeof users.$inferSelect, meta?: SessionClientMeta): Promise<AuthTokens> => {
    const db = getDb()
    await sessionService.maintainForUser(userRow.id)

    const accessToken = await createAccessToken({ sub: userRow.id, role: userRow.role })
    const refreshToken = await createRefreshToken({ sub: userRow.id })
    const now = new Date()

    const [session] = await db.insert(refreshTokens).values({
      userId: userRow.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiresAt(),
      userAgent: meta?.userAgent ?? null,
      lastUsedAt: now,
    }).returning({ id: refreshTokens.id })

    await sessionService.enforceSessionLimit(userRow.id, session.id)

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
    }
  },

  refresh: async ({ refreshToken }: RefreshTokenInput, meta?: SessionClientMeta): Promise<AuthTokens> => {
    const payload = await verifyToken<{ sub: string }>(refreshToken).catch(() => null)

    if (!payload?.sub) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid refresh token' })
    }

    const db = getDb()
    const tokenHash = hashToken(refreshToken)
    const [storedToken] = await db.select().from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid refresh token' })
    }

    const [userRow] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1)

    if (!userRow) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid refresh token' })
    }

    const newRefreshToken = await createRefreshToken({ sub: userRow.id })
    const now = new Date()

    await db.update(refreshTokens).set({
      tokenHash: hashToken(newRefreshToken),
      expiresAt: getRefreshTokenExpiresAt(),
      lastUsedAt: now,
      userAgent: meta?.userAgent ?? storedToken.userAgent,
    }).where(eq(refreshTokens.id, storedToken.id))

    const accessToken = await createAccessToken({ sub: userRow.id, role: userRow.role })

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: storedToken.id,
    }
  },

  logout: async ({ refreshToken }: RefreshTokenInput) => {
    const db = getDb()
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hashToken(refreshToken)))
  },

  verifyMfa: async (challengeToken: string, code: string, meta?: SessionClientMeta): Promise<AuthSession> => {
    const userRow = await twoFactorService.verifyLoginChallenge(challengeToken, code)
    return buildAuthSession(userRow, meta)
  },

  getMe: async (userId: string): Promise<User> => {
    const db = getDb()
    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!userRow) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return mapUser(userRow)
  },
}
