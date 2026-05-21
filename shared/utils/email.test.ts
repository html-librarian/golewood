import { describe, expect, it } from 'vitest'
import { maskEmailForVerification, normalizeEmail } from './email'

describe('email utils', () => {
  it('normalizes email', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com')
  })

  it('masks email for verification UI', () => {
    expect(maskEmailForVerification('user@example.com')).toBe('u***r@example.com')
  })
})