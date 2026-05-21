import { describe, expect, it } from 'vitest'
import {
  buildSearchRouteQuery,
  normalizeSearchPage,
  parseSearchParamsFromRoute,
  searchFilterCacheKey,
  searchParamsCacheKey,
} from './search-query'

describe('search-query utils', () => {
  it('round-trips page in route query', () => {
    const built = buildSearchRouteQuery({ city: 'Москва', page: 2, pageSize: 24 })
    const parsed = parseSearchParamsFromRoute(built)

    expect(parsed.city).toBe('Москва')
    expect(parsed.page).toBe(2)
    expect(parsed.pageSize).toBe(24)
  })

  it('omits page 1 from route query', () => {
    const built = buildSearchRouteQuery({ city: 'Сочи', page: 1 })

    expect(built.page).toBeUndefined()
  })

  it('normalizeSearchPage clears first page', () => {
    expect(normalizeSearchPage(1)).toBeUndefined()
    expect(normalizeSearchPage(2)).toBe(2)
  })

  it('searchFilterCacheKey ignores pagination', () => {
    const filters = { city: 'Казань', sort: 'price_asc' as const }
    const pageOne = searchFilterCacheKey({ ...filters, page: 1 })
    const pageTwo = searchFilterCacheKey({ ...filters, page: 2, pageSize: 24 })

    expect(pageOne).toBe(pageTwo)
    expect(pageOne).not.toBe(searchParamsCacheKey({ ...filters, page: 2 }))
  })
})
