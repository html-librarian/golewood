import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('spotlight page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('has title and subtitle', () => {
    expect(ru.title).toBeTruthy()
    expect(ru.subtitle).toBeTruthy()
    expect(en.title).toBeTruthy()
  })
})
