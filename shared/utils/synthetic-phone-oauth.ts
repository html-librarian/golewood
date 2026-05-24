import { createHash } from 'node:crypto'

/** Placeholder +7 for OAuth accounts until the user sets a real mobile (+7998xxxxxxxx). */
export const syntheticOAuthPhone = (provider: string, providerUserId: string) => {
  const hash = createHash('sha256').update(`${provider}:${providerUserId}`).digest('hex')
  const digits = Array.from({ length: 8 }, (_, index) =>
    String(parseInt(hash.slice(index * 2, index * 2 + 2), 16) % 10),
  ).join('')

  return `+7998${digits}`
}
