import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('home page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('has title message', () => {
    expect(ru.title).toBeTruthy()
    expect(en.title).toBeTruthy()
  })

  it('has featured city i18n keys in all locales', () => {
    expect(ru.featuredInCity).toBeTruthy()
    expect(en.featuredInCity).toBeTruthy()
  })

  it('has carousel i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
    expect(ru.carouselPrev).toBeTruthy()
    expect(en.carouselNext).toBeTruthy()
  })
})
