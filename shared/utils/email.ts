export const normalizeEmail = (email: string) => email.trim().toLowerCase()

/** Mask for UI when confirming email (a***b@example.com). */
export const maskEmailForVerification = (email: string) => {
  const normalized = normalizeEmail(email)
  const at = normalized.indexOf('@')

  if (at <= 0) {
    return '***'
  }

  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)

  if (local.length <= 2) {
    return `**@${domain}`
  }

  return `${local[0]}***${local.slice(-1)}@${domain}`
}
