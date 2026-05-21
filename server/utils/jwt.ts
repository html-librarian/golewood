import { SignJWT, jwtVerify } from 'jose'
import { createHash, randomInt, randomUUID } from 'node:crypto'
import { allowAuthDevCode } from './dev-guards'

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL_DAYS = 7
const OTP_TTL_SECONDS = 300

const getSecret = () => {
  const config = useRuntimeConfig()
  return new TextEncoder().encode(config.jwtSecret)
}

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export const generateOtpCode = () => {
  const config = useRuntimeConfig()

  if (allowAuthDevCode(config.authDevCode)) {
    return config.authDevCode
  }

  return String(randomInt(1000, 9999))
}

export const getOtpTtl = () => OTP_TTL_SECONDS

export const createAccessToken = async (payload: { sub: string, role: string }) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret())

export const createRefreshToken = async (payload: { sub: string }) =>
  new SignJWT({ ...payload, jti: randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_DAYS}d`)
    .sign(getSecret())

export const verifyToken = async <T extends Record<string, unknown>>(token: string) => {
  const { payload } = await jwtVerify<T>(token, getSecret())
  return payload
}

export const getRefreshTokenExpiresAt = () => {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TOKEN_TTL_DAYS)
  return date
}
