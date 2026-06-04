import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('stories page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('has archive section keys', () => {
    expect(ru.archive).toBeTruthy()
    expect(ru.archiveEmpty).toBeTruthy()
    expect(en.archive).toBeTruthy()
  })
})
