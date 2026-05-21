import { describe, expect, it } from 'vitest'
import { buildListingJsonLd } from './seo'

describe('buildListingJsonLd', () => {
  it('builds lodging business schema', () => {
    const jsonLd = buildListingJsonLd({
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Cozy flat',
      description: 'Nice place',
      city: 'Moscow',
      pricePerNight: 5000,
      coverPhotoUrl: '/uploads/photo.jpg',
    }, 'https://golewood.ru')

    expect(jsonLd['@type']).toBe('LodgingBusiness')
    expect(jsonLd.url).toContain('550e8400-e29b-41d4-a716-446655440000')
    expect(jsonLd.address.addressLocality).toBe('Moscow')
  })
})
