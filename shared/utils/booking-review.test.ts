import { describe, expect, it } from 'vitest'
import { isBookingReviewable } from './booking-review'

describe('isBookingReviewable', () => {
  it('allows completed stays regardless of checkout date', () => {
    expect(isBookingReviewable('completed', '2099-01-01')).toBe(true)
  })

  it('allows confirmed stays after checkout date', () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const checkOut = yesterday.toISOString().slice(0, 10)

    expect(isBookingReviewable('confirmed', checkOut)).toBe(true)
  })

  it('rejects confirmed stays before checkout', () => {
    expect(isBookingReviewable('confirmed', '2099-12-31')).toBe(false)
  })

  it('rejects pending and cancelled', () => {
    expect(isBookingReviewable('pending', '2020-01-01')).toBe(false)
    expect(isBookingReviewable('cancelled', '2020-01-01')).toBe(false)
  })
})
