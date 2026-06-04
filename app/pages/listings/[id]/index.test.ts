import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('listing detail page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('includes review auth empty-state keys', () => {
    expect(ru.addReview).toBeTruthy()
    expect(ru.reviewAuthModalTitle).toBeTruthy()
    expect(ru.reviewAuthModalDescription).toBeTruthy()
  })

  it('includes traveler blog section keys', () => {
    expect(ru.travelerStories).toBeTruthy()
    expect(en.writeAboutPlace).toBeTruthy()
  })
})
