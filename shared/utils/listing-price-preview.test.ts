import { describe, expect, it } from 'vitest'
import {
  calcGuestNightlyTotal,
  calcNightlyServiceFee,
  formatListingPriceBreakdown,
  resolveListingPricePerNight,
} from './listing-price-preview'

describe('listing-price-preview', () => {
  it('calculates service fee and guest total from base price', () => {
    expect(calcNightlyServiceFee(3000)).toBe(300)
    expect(calcGuestNightlyTotal(3000)).toBe(3300)
    expect(formatListingPriceBreakdown(4500)).toEqual({
      pricePerNight: 4500,
      serviceFee: 450,
      guestTotal: 4950,
    })
  })

  it('resolves stored base from host net input', () => {
    expect(resolveListingPricePerNight('hostNet', 4500)).toBe(4500)
  })

  it('resolves stored base from guest total input', () => {
    expect(resolveListingPricePerNight('guestTotal', 3300)).toBe(3000)
    expect(calcGuestNightlyTotal(resolveListingPricePerNight('guestTotal', 3300))).toBe(3300)
  })
})
