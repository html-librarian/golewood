import { describe, expect, it } from 'vitest'
import {
  BONUS_MIN_CASH_PAYMENT,
  calculateReviewBonusReward,
  clampBonusToApply,
  getBookingCashDue,
  getMaxBonusForBooking,
} from './bonus'

describe('bonus utils', () => {
  it('limits bonus by percent and balance', () => {
    expect(getMaxBonusForBooking(10_000, 5_000)).toBe(3_000)
  })

  it('limits bonus by percent and minimum cash on large bookings', () => {
    expect(getMaxBonusForBooking(5_000, 5_000)).toBe(1_500)
    expect(clampBonusToApply(5_000, 5_000, 5_000)).toBe(1_500)
  })

  it('allows full bonus payment for small totals', () => {
    expect(getMaxBonusForBooking(80, 200)).toBe(80)
    expect(getBookingCashDue(80, 80)).toBe(0)
  })

  it('calculates review reward with cap', () => {
    expect(calculateReviewBonusReward(50_000)).toBe(2_000)
    expect(calculateReviewBonusReward(10_000)).toBe(500)
  })

  it('cash due never negative', () => {
    expect(getBookingCashDue(1_000, 1_200)).toBe(0)
  })

  it('respects min cash constant', () => {
    expect(BONUS_MIN_CASH_PAYMENT).toBeGreaterThan(0)
  })
})
