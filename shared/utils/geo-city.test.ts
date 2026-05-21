import { describe, expect, it } from 'vitest'
import { resolveNearestCityName } from './geo-city'

describe('resolveNearestCityName', () => {
  it('resolves Moscow coordinates', () => {
    expect(resolveNearestCityName(55.7558, 37.6173)).toBe('Москва')
  })

  it('resolves Saint Petersburg coordinates', () => {
    expect(resolveNearestCityName(59.93, 30.34)).toBe('Санкт-Петербург')
  })

  it('returns null when far from catalog cities', () => {
    expect(resolveNearestCityName(0, 0)).toBeNull()
  })
})
