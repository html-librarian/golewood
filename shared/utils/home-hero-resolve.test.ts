import { describe, expect, it } from 'vitest'
import { resolveHomeHero } from './home-hero-resolve'

const emptyContest = {
  monthKey: null,
  imageUrl: null,
  caption: null,
  listingTitle: null,
  listingCity: null,
  authorName: null,
}

const contestWithPhoto = {
  ...emptyContest,
  monthKey: '2026-05',
  imageUrl: '/contest.jpg',
  listingTitle: 'Глэмпинг',
}

describe('resolveHomeHero', () => {
  it('uses contest in auto mode when winner exists', () => {
    const hero = resolveHomeHero({
      mode: 'auto',
      imageUrl: '/custom.jpg',
      creditRu: null,
      creditEn: null,
    }, contestWithPhoto)

    expect(hero.source).toBe('contest')
    expect(hero.imageUrl).toBe('/contest.jpg')
  })

  it('falls back to custom in auto mode without contest', () => {
    const hero = resolveHomeHero({
      mode: 'auto',
      imageUrl: '/custom.jpg',
      creditRu: 'Подпись',
      creditEn: null,
    }, emptyContest)

    expect(hero.source).toBe('custom')
    expect(hero.creditRu).toBe('Подпись')
  })

  it('forces custom mode', () => {
    const hero = resolveHomeHero({
      mode: 'custom',
      imageUrl: '/custom.jpg',
      creditRu: null,
      creditEn: null,
    }, contestWithPhoto)

    expect(hero.source).toBe('custom')
    expect(hero.imageUrl).toBe('/custom.jpg')
  })
})
