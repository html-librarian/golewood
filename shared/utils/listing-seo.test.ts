import { describe, expect, it } from 'vitest'
import {
  buildListingMetaDescription,
  buildListingMetaTitle,
  pickListingOgImage,
} from './listing-seo'

describe('listing-seo', () => {
  const base = {
    id: 'id-1',
    title: 'Глэмпинг у озера',
    description: 'Уютные домики с баней и завтраком.',
    city: 'Карелия',
    pricePerNight: 8500,
    maxGuests: 4,
  }

  it('builds title from listing when meta title empty', () => {
    expect(buildListingMetaTitle(base)).toBe('Глэмпинг у озера — Карелия')
  })

  it('uses custom meta title when set', () => {
    expect(buildListingMetaTitle({ ...base, metaTitle: 'Лучший отдых на выходные' }))
      .toBe('Лучший отдых на выходные')
  })

  it('builds description with city and price fallback', () => {
    expect(buildListingMetaDescription({ ...base, description: '' }))
      .toContain('Карелия')
    expect(buildListingMetaDescription({ ...base, description: '' }))
      .toContain('8')
  })

  it('prefers cover photo over default og image', () => {
    expect(pickListingOgImage('/uploads/a.jpg', 'https://golewood.ru', '/og-default.png'))
      .toBe('https://golewood.ru/uploads/a.jpg')
    expect(pickListingOgImage(null, 'https://golewood.ru', '/og-default.png'))
      .toBe('https://golewood.ru/og-default.png')
  })
})
