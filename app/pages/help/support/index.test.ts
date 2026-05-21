import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('help support page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('uses email interpolation in form error without @ in message source', () => {
    expect(ru.form.error).toContain('{email}')
    expect(ru.form.error).not.toMatch(/@[a-z]/i)
  })
})
