import { describe, expect, it } from 'vitest'
import { scaleSettlementForCashDue } from './booking-settlement'

describe('scaleSettlementForCashDue', () => {
  it('returns full amounts when cash covers total', () => {
    expect(scaleSettlementForCashDue(10_000, 1000, 11_000, 11_000)).toEqual({
      hostAmount: 10_000,
      platformFee: 1000,
    })
  })

  it('scales proportionally when bonuses reduce cash due', () => {
    const scaled = scaleSettlementForCashDue(10_000, 1000, 11_000, 7700)

    expect(scaled.hostAmount + scaled.platformFee).toBe(7700)
    expect(scaled.hostAmount).toBeGreaterThan(6000)
    expect(scaled.platformFee).toBeGreaterThan(0)
  })

  it('returns zeros when nothing to charge', () => {
    expect(scaleSettlementForCashDue(10_000, 1000, 11_000, 0)).toEqual({
      hostAmount: 0,
      platformFee: 0,
    })
  })
})
