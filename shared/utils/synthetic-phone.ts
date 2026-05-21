import { createHash } from 'node:crypto'
import { normalizeEmail } from './email'

/** Synthetic +7 number for email-only accounts (does not collide with real +79… ranges). */
export const syntheticPhoneFromEmail = (email: string) => {
  const hash = createHash('sha256').update(normalizeEmail(email)).digest('hex')
  const digits = Array.from({ length: 7 }, (_, index) =>
    String(parseInt(hash.slice(index * 2, index * 2 + 2), 16) % 10),
  ).join('')

  return `+7999${digits}`
}
