import { describe, expect, it } from 'vitest'
import { resolveAmenityIcon } from './amenity-icon'

describe('resolveAmenityIcon', () => {
  it('returns fallback icon for missing phosphor glyphs', () => {
    expect(resolveAmenityIcon('ph:microwave-duotone')).toBe('ph:oven-duotone')
    expect(resolveAmenityIcon('ph:surfboard-duotone')).toBe('ph:person-simple-swim-duotone')
    expect(resolveAmenityIcon('ph:shuttlecock-duotone')).toBe('ph:volleyball-duotone')
    expect(resolveAmenityIcon('ph:bottle-duotone')).toBe('ph:spray-bottle-duotone')
  })

  it('returns valid icons unchanged', () => {
    expect(resolveAmenityIcon('ph:wifi-high-duotone')).toBe('ph:wifi-high-duotone')
  })

  it('returns default when icon is empty', () => {
    expect(resolveAmenityIcon(null)).toBe('ph:check-circle-duotone')
  })
})
