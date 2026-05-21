import { describe, expect, it } from 'vitest'
import {
  calculateHostPromoBookingReward,
  partitionBoostedFirst,
  partitionPromotedForSearch,
} from './promotion'

describe('promotion utils', () => {
  it('calculates host booking reward with cap', () => {
    expect(calculateHostPromoBookingReward(50_000)).toBe(300)
    expect(calculateHostPromoBookingReward(10_000)).toBe(100)
    expect(calculateHostPromoBookingReward(0)).toBe(0)
  })

  it('partitions boosted listings first', () => {
    const items = [
      { id: 'a', promotions: { highlight: false, boost: false } },
      { id: 'b', promotions: { highlight: true, boost: true } },
      { id: 'c', promotions: { highlight: false, boost: false } },
    ]

    expect(partitionBoostedFirst(items).map(item => item.id)).toEqual(['b', 'a', 'c'])
  })

  it('partitions city pin before boost when city matches', () => {
    const items = [
      { id: 'a', city: 'Москва', promotions: { boost: true, cityPin: false } },
      { id: 'b', city: 'Москва', promotions: { boost: false, cityPin: true } },
      { id: 'c', city: 'СПб', promotions: { boost: false, cityPin: true } },
    ]

    expect(partitionPromotedForSearch(items, 'Москва').map(item => item.id)).toEqual(['b', 'a', 'c'])
  })
})
