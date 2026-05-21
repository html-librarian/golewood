import { describe, expect, it } from 'vitest'
import { getHostPromoPointPackage, HOST_PROMO_POINT_PACKAGES } from './host-promo-packages'

describe('host promo point packages', () => {
  it('exposes packages with unique slugs', () => {
    const slugs = HOST_PROMO_POINT_PACKAGES.map(item => item.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(HOST_PROMO_POINT_PACKAGES.every(item => item.points > 0 && item.priceRub > 0)).toBe(true)
  })

  it('resolves package by slug', () => {
    expect(getHostPromoPointPackage('pack_600')?.points).toBe(600)
    expect(getHostPromoPointPackage('missing')).toBeNull()
  })
})
