import { describe, expect, it } from 'vitest'
import { isSyntheticEmailPhone } from './synthetic-phone-detect'
import { syntheticPhoneFromEmail } from './synthetic-phone'

describe('syntheticPhoneFromEmail', () => {
  it('returns a valid +7 phone', () => {
    const phone = syntheticPhoneFromEmail('user@example.com')

    expect(phone).toMatch(/^\+7\d{10}$/)
    expect(phone.startsWith('+7999')).toBe(true)
  })

  it('is stable for the same email', () => {
    expect(syntheticPhoneFromEmail('a@b.c')).toBe(syntheticPhoneFromEmail('a@b.c'))
  })
})

describe('isSyntheticEmailPhone', () => {
  it('detects synthetic phones', () => {
    expect(isSyntheticEmailPhone(syntheticPhoneFromEmail('x@y.z'))).toBe(true)
    expect(isSyntheticEmailPhone('+79000000002')).toBe(false)
    expect(isSyntheticEmailPhone('+799812345678')).toBe(false)
  })
})
