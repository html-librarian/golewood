import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('legal requisites page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('escapes @ in intro for vue-i18n linked-message syntax', () => {
    expect(ru.intro).toContain("support{'@'}golewood.ru")
    expect(ru.intro).not.toMatch(/support@[^'{]/)
  })
})
