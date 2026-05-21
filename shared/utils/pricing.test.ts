import { describe, expect, it } from 'vitest'
import { calculateBookingPrice, splitBookingSettlement } from './pricing'

describe('calculateBookingPrice', () => {
  it('adds 10% platform fee on accommodation by default', () => {
    const result = calculateBookingPrice(1, 10_000)

    expect(result.subtotal).toBe(10_000)
    expect(result.serviceFee).toBe(1000)
    expect(result.total).toBe(11_000)
    expect(splitBookingSettlement(result)).toEqual({
      hostAmount: 10_000,
      platformFee: 1000,
    })
  })

  it('calculates stay total without platform fees when percent is zero', () => {
    const result = calculateBookingPrice(8, 4500, { serviceFeePercent: 0 })

    expect(result.subtotal).toBe(36000)
    expect(result.serviceFee).toBe(0)
    expect(result.total).toBe(36000)
  })

  it('adds fixed transfer price when selected', () => {
    const result = calculateBookingPrice(2, 5000, { transferPrice: 3000 })

    expect(result.subtotal).toBe(10000)
    expect(result.transferPrice).toBe(3000)
    expect(result.serviceFee).toBe(1000)
    expect(result.total).toBe(14_000)
  })

  it('marks transfer on request without adding to total', () => {
    const result = calculateBookingPrice(2, 5000, {
      transferPrice: 0,
      transferOnRequest: true,
    })

    expect(result.transferOnRequest).toBe(true)
    expect(result.serviceFee).toBe(1000)
    expect(result.total).toBe(11_000)
  })

  it('adds surcharge for extra guests per night', () => {
    const result = calculateBookingPrice(3, 5000, {
      guests: 6,
      maxGuestsIncluded: 4,
      extraGuestPricePerNight: 800,
    })

    expect(result.extraGuests).toBe(2)
    expect(result.extraGuestTotal).toBe(4800)
    expect(result.serviceFee).toBe(1980)
    expect(result.total).toBe(21_780)
  })
})
