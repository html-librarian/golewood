import { SignJWT, jwtVerify } from 'jose'
import { normalizeEmail } from '#shared/utils/email'

export const EMAIL_MAGIC_PURPOSES = ['email-login', 'account-email'] as const
export type EmailMagicPurpose = typeof EMAIL_MAGIC_PURPOSES[number]

export type EmailMagicPayload = {
  purpose: EmailMagicPurpose
  email: string
  sub?: string
  name?: string
}

const MAGIC_LINK_TTL = '15m'

const getSecret = () => {
  const config = useRuntimeConfig()
  return new TextEncoder().encode(config.jwtSecret)
}

export const buildEmailMagicUrl = async (payload: EmailMagicPayload) => {
  const config = useRuntimeConfig()
  const token = await createEmailMagicToken(payload)
  const base = config.public.siteUrl.replace(/\/$/, '')

  return `${base}/auth/email-callback?token=${encodeURIComponent(token)}`
}

export const createEmailMagicToken = async (payload: EmailMagicPayload) => {
  const normalizedEmail = normalizeEmail(payload.email)

  return new SignJWT({
    purpose: payload.purpose,
    email: normalizedEmail,
    ...(payload.sub ? { sub: payload.sub } : {}),
    ...(payload.name ? { name: payload.name } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(MAGIC_LINK_TTL)
    .sign(getSecret())
}

export const verifyEmailMagicToken = async (token: string): Promise<EmailMagicPayload> => {
  const { payload } = await jwtVerify<EmailMagicPayload>(token, getSecret())

  if (!payload.purpose || !payload.email) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid magic link' })
  }

  if (!EMAIL_MAGIC_PURPOSES.includes(payload.purpose)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid magic link' })
  }

  return {
    purpose: payload.purpose,
    email: normalizeEmail(String(payload.email)),
    sub: payload.sub ? String(payload.sub) : undefined,
    name: payload.name ? String(payload.name) : undefined,
  }
}
