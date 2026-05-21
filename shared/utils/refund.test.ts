import { describe, expect, it } from 'vitest'
import { calculateRefund } from './refund'

const checkIn = '2026-09-05'

describe('calculateRefund', () => {
  it('returns full refund for flexible policy 24h+ before check-in', () => {
    const cancelledAt = new Date('2026-09-03T12:00:00Z')
    const result = calculateRefund(10_000, 'flexible', checkIn, cancelledAt)

    expect(result).toEqual({ refundAmount: 10_000, refundPercent: 100 })
  })

  it('returns no refund for flexible policy within 24h of check-in', () => {
    const cancelledAt = new Date('2026-09-04T12:00:00Z')
    const result = calculateRefund(10_000, 'flexible', checkIn, cancelledAt)

    expect(result).toEqual({ refundAmount: 0, refundPercent: 0 })
  })

  it('returns full refund for moderate policy 5+ days before check-in', () => {
    const cancelledAt = new Date('2026-08-30T12:00:00Z')
    const result = calculateRefund(10_000, 'moderate', checkIn, cancelledAt)

    expect(result).toEqual({ refundAmount: 10_000, refundPercent: 100 })
  })

  it('returns no refund for moderate policy within 5 days', () => {
    const cancelledAt = new Date('2026-09-02T12:00:00Z')
    const result = calculateRefund(10_000, 'moderate', checkIn, cancelledAt)

    expect(result).toEqual({ refundAmount: 0, refundPercent: 0 })
  })

  it('returns 50% refund for strict policy 7+ days before check-in', () => {
    const cancelledAt = new Date('2026-08-20T12:00:00Z')
    const result = calculateRefund(10_000, 'strict', checkIn, cancelledAt)

    expect(result).toEqual({ refundAmount: 5000, refundPercent: 50 })
  })

  it('returns no refund for strict policy within 7 days', () => {
    const cancelledAt = new Date('2026-09-01T12:00:00Z')
    const result = calculateRefund(10_000, 'strict', checkIn, cancelledAt)

    expect(result).toEqual({ refundAmount: 0, refundPercent: 0 })
  })
})
