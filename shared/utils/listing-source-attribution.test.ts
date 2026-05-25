import { describe, expect, it } from 'vitest'
import {
  getListingSourceAttributionText,
  normalizeSourceAttribution,
} from './listing-source-attribution'

describe('listing source attribution', () => {
  it('normalizes empty values to null', () => {
    expect(normalizeSourceAttribution('   ')).toBeNull()
    expect(normalizeSourceAttribution('  Сайт отеля  ')).toBe('Сайт отеля')
  })

  it('prefers locale-specific text with fallback', () => {
    expect(getListingSourceAttributionText({
      sourceAttributionRu: 'Официальный сайт',
      sourceAttributionEn: null,
    }, 'en')).toBe('Официальный сайт')

    expect(getListingSourceAttributionText({
      sourceAttributionRu: 'Официальный сайт',
      sourceAttributionEn: 'Official website',
    }, 'en')).toBe('Official website')
  })
})
