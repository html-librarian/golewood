import { describe, expect, it } from 'vitest'
import { LISTING_STATUSES } from './listing'

describe('listing statuses', () => {
  it('includes archived and draft for restore flow', () => {
    expect(LISTING_STATUSES).toContain('archived')
    expect(LISTING_STATUSES).toContain('draft')
  })
})
