import { describe, expect, it } from 'vitest'
import { formatMonthLabel, getCurrentMonthKey } from './spotlight-month'

describe('spotlight-month utils', () => {
  it('getCurrentMonthKey returns YYYY-MM', () => {
    expect(getCurrentMonthKey()).toMatch(/^\d{4}-\d{2}$/)
  })

  it('formatMonthLabel returns non-empty string', () => {
    const key = getCurrentMonthKey()
    expect(formatMonthLabel(key, 'ru').length).toBeGreaterThan(0)
    expect(formatMonthLabel(key, 'en').length).toBeGreaterThan(0)
  })
})
