import { describe, expect, it } from 'vitest'
import { HOME_DISCOVERY_GROUPS } from './home-discovery'
import { buildSearchRouteQuery } from '#shared/utils/search-query'

describe('home-discovery', () => {
  it('defines filter groups with search params', () => {
    expect(HOME_DISCOVERY_GROUPS.length).toBeGreaterThan(0)

    const cityFilter = HOME_DISCOVERY_GROUPS[0]?.filters[0]
    expect(cityFilter?.params.city).toBeTruthy()

    const amenityFilter = HOME_DISCOVERY_GROUPS[1]?.filters[0]
    expect(amenityFilter?.params.amenities?.length).toBeGreaterThan(0)
  })

  it('builds valid search routes for filters', () => {
    const pets = HOME_DISCOVERY_GROUPS[1]?.filters.find(item => item.id === 'pets')
    expect(buildSearchRouteQuery(pets!.params)).toEqual({ amenities: 'pets_allowed' })

    const sochi = HOME_DISCOVERY_GROUPS[0]?.filters.find(item => item.id === 'sochi')
    expect(buildSearchRouteQuery(sochi!.params)).toEqual({ city: 'Сочи' })
  })
})
