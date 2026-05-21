import { describe, expect, it } from 'vitest'
import { countNights, eachDay, rangesOverlap, canCompleteBooking } from './dates'

describe('dates utils', () => {
  it('counts nights between dates', () => {
    expect(countNights('2026-06-01', '2026-06-05')).toBe(4)
  })

  it('lists each day in range', () => {
    expect(eachDay('2026-06-01', '2026-06-03')).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ])
  })

  it('detects overlapping ranges', () => {
    expect(rangesOverlap('2026-06-01', '2026-06-05', '2026-06-04', '2026-06-08')).toBe(true)
    expect(rangesOverlap('2026-06-01', '2026-06-03', '2026-06-04', '2026-06-08')).toBe(false)
  })

  it('allows complete only after checkout date', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(canCompleteBooking(today)).toBe(true)
    expect(canCompleteBooking('2099-01-01')).toBe(false)
  })
})
