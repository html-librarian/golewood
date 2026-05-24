import { describe, expect, it } from 'vitest'
import { isPlaceholderPhone, isSyntheticOAuthPhone } from './synthetic-phone-detect'
import { syntheticOAuthPhone } from './synthetic-phone-oauth'

describe('syntheticOAuthPhone', () => {
  it('returns +7998 placeholder range', () => {
    const phone = syntheticOAuthPhone('yandex', '12345')

    expect(phone).toMatch(/^\+7998\d{8}$/)
    expect(isSyntheticOAuthPhone(phone)).toBe(true)
    expect(isPlaceholderPhone(phone)).toBe(true)
  })
})
