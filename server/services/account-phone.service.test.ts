import { describe, expect, it } from 'vitest'
import { isSyntheticEmailPhone } from '#shared/utils/synthetic-phone-detect'

describe('account phone change — current number gate', () => {
  it('skips old-phone verification for synthetic email phones', () => {
    expect(isSyntheticEmailPhone('+79991234567')).toBe(true)
    expect(isSyntheticEmailPhone('+79001234567')).toBe(false)
  })
})
