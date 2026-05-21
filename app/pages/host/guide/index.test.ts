import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('host guide hub', () => {
  it('has matching i18n keys', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })
})
