import { describe, expect, it } from 'vitest'
import { buildSearchActiveFilterTags } from './search-active-filters'

const catalog = {
  amenities: [{ slug: 'pool', labelRu: 'Бассейн', labelEn: 'Pool' }],
  accommodationCatalog: [{ slug: 'dome', labelRu: 'Купольный дом', labelEn: 'Dome' }],
  teamBadgeCatalog: [{ slug: 'team_visited', labelRu: 'Мы здесь отдыхали', labelEn: 'We stayed here' }],
}

const priceLabels = {
  priceFromLabel: (price: string) => `от ${price}`,
  priceToLabel: (price: string) => `до ${price}`,
  priceRangeLabel: (min: string, max: string) => `${min} – ${max}`,
}

describe('buildSearchActiveFilterTags', () => {
  it('builds price range and slug tags with localized labels', () => {
    const tags = buildSearchActiveFilterTags({
      minPrice: '5000',
      maxPrice: '15000',
      amenities: ['pool'],
      accommodationTypes: ['dome'],
      teamBadgeSlugs: ['team_visited'],
      amenityCatalog: catalog.amenities,
      accommodationCatalog: catalog.accommodationCatalog,
      teamBadgeCatalog: catalog.teamBadgeCatalog,
      locale: 'ru',
      ...priceLabels,
    })

    expect(tags.map(tag => tag.kind)).toEqual(['price', 'teamBadge', 'accommodationType', 'amenity'])
    expect(tags[0]?.label).toContain('–')
    expect(tags[1]?.label).toBe('Мы здесь отдыхали')
    expect(tags[2]?.label).toBe('Купольный дом')
    expect(tags[3]?.label).toBe('Бассейн')
  })

  it('omits price tag when no bounds set', () => {
    const tags = buildSearchActiveFilterTags({
      minPrice: '',
      maxPrice: '',
      amenities: ['pool'],
      accommodationTypes: [],
      teamBadgeSlugs: [],
      amenityCatalog: catalog.amenities,
      accommodationCatalog: catalog.accommodationCatalog,
      teamBadgeCatalog: catalog.teamBadgeCatalog,
      locale: 'en',
      ...priceLabels,
    })

    expect(tags).toHaveLength(1)
    expect(tags[0]?.label).toBe('Pool')
  })
})
