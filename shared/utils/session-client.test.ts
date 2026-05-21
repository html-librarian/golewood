import { describe, expect, it } from 'vitest'
import { formatSessionDeviceLabel } from '#shared/utils/session-client'

const labels = { unknown: 'Browser', phone: 'phone' }

describe('formatSessionDeviceLabel', () => {
  it('returns unknown for empty ua', () => {
    expect(formatSessionDeviceLabel(null, labels)).toBe('Browser')
  })

  it('detects chrome on windows desktop', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    expect(formatSessionDeviceLabel(ua, labels)).toBe('Chrome · Windows')
  })

  it('detects safari on iphone', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
    expect(formatSessionDeviceLabel(ua, labels)).toBe('Safari · iOS · phone')
  })
})
