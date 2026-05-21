import { describe, expect, it } from 'vitest'
import { parseSearchParamsFromRoute, searchParamsCacheKey } from '../../../shared/utils/search-query'
import ru from './i18n/ru'
import en from './i18n/en'

describe('search page', () => {
  it('has i18n keys in all locales', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
  })

  it('parses route query for list and map search', () => {
    const params = parseSearchParamsFromRoute({
      city: 'Москва',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      guests: '2',
    })

    expect(params.city).toBe('Москва')
    expect(params.checkIn).toBe('2026-06-01')
    expect(params.guests).toBe(2)
  })

  it('uses stable cache keys for amenities order', () => {
    const a = searchParamsCacheKey({ city: 'Сочи', amenities: ['pool', 'wifi'] })
    const b = searchParamsCacheKey({ city: 'Сочи', amenities: ['wifi', 'pool'] })

    expect(a).toBe(b)
  })

  it('parses team badge slugs from route', () => {
    const params = parseSearchParamsFromRoute({
      teamBadgeSlugs: 'team_visited,team_approved',
    })

    expect(params.teamBadgeSlugs).toEqual(['team_visited', 'team_approved'])
  })

  it('parses page from route', () => {
    const params = parseSearchParamsFromRoute({ page: '3', pageSize: '12' })

    expect(params.page).toBe(3)
    expect(params.pageSize).toBe(12)
  })

  it('parses team catalog filter from route', () => {
    const params = parseSearchParamsFromRoute({ teamCatalog: '1' })

    expect(params.teamCatalog).toBe(true)
  })
})
