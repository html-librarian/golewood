import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('SpotlightUpload', () => {
  it('has matching i18n keys', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('escapes @ in instagram placeholder for vue-i18n', () => {
    expect(ru.externalInstagramPlaceholder).toContain("{'@'}")
    expect(en.externalInstagramPlaceholder).toContain("{'@'}")
  })

  it('includes listing picker label', () => {
    expect(ru.listing).toBeTruthy()
    expect(ru.sourceExternal).toBeTruthy()
  })
})
