import { describe, expect, it } from 'vitest'
import { formatPhoneDisplay, maskPhoneForVerification, normalizePhone } from './phone'

describe('phone utils', () => {
  it('normalizes 10-digit number', () => {
    expect(normalizePhone('9991234567')).toBe('+79991234567')
  })

  it('normalizes 8-prefix number', () => {
    expect(normalizePhone('89991234567')).toBe('+79991234567')
  })

  it('formats phone for display', () => {
    expect(formatPhoneDisplay('+79991234567')).toBe('+7 (999) 123-45-67')
  })

  it('masks phone for current-number verification UI', () => {
    expect(maskPhoneForVerification('+79991234567')).toBe('+7 *** *** 45 67')
  })
})
