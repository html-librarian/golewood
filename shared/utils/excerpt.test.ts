import { describe, expect, it } from 'vitest'
import { buildExcerpt } from './excerpt'

describe('buildExcerpt', () => {
  it('truncates long text', () => {
    const text = 'a'.repeat(300)
    expect(buildExcerpt(text).length).toBeLessThanOrEqual(280)
    expect(buildExcerpt(text).endsWith('…')).toBe(true)
  })
})
