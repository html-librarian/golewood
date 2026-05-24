import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('SpotlightUpload', () => {
  it('has matching i18n keys', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('includes external upload field labels', () => {
    expect(ru.placeName).toBeTruthy()
    expect(ru.externalSite).toBeTruthy()
    expect(ru.externalInstagram).toBeTruthy()
    expect(ru.sourceExternal).toBeTruthy()
  })
})
