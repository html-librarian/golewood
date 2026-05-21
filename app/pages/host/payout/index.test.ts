import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('host payout page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
    expect(ru.howSteps.length).toBe(4)
  })
})
