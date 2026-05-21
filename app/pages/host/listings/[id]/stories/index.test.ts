import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('host listing stories page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('has pin actions', () => {
    expect(ru.pin).toBeTruthy()
    expect(ru.unpin).toBeTruthy()
  })
})
