import { describe, expect, it } from 'vitest'
import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'
import { sortDiscoveryDestinations } from './discovery-destinations-sort'

const filters: HomeDiscoveryFilter[] = [
  { id: 'sochi', labelRu: 'Сочи', labelEn: 'Sochi', icon: 'ph:sun', tone: 'from-sky-400', params: { city: 'Сочи' } },
  { id: 'kazan', labelRu: 'Казань', labelEn: 'Kazan', icon: 'ph:mosque', tone: 'from-emerald-500', params: { city: 'Казань' } },
  { id: 'spb', labelRu: 'Санкт-Петербург', labelEn: 'SPb', icon: 'ph:buildings', tone: 'from-slate-500', params: { city: 'Санкт-Петербург' } },
]

describe('sortDiscoveryDestinations', () => {
  it('prioritizes geo city over profile', () => {
    const sorted = sortDiscoveryDestinations(filters, {
      geoCity: 'Санкт-Петербург',
      profileCity: 'Казань',
    })

    expect(sorted[0]?.id).toBe('spb')
  })

  it('uses profile city when geo is missing', () => {
    const sorted = sortDiscoveryDestinations(filters, {
      profileCity: 'Казань',
    })

    expect(sorted[0]?.id).toBe('kazan')
  })

  it('keeps order when no match', () => {
    expect(sortDiscoveryDestinations(filters, { profileCity: 'Тула' }).map(f => f.id)).toEqual(['sochi', 'kazan', 'spb'])
  })
})
