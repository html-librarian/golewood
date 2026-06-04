import { describe, expect, it } from 'vitest'
import { staggerDelayMs } from './stagger-delay'

describe('staggerDelayMs', () => {
  it('scales with index and caps at max', () => {
    expect(staggerDelayMs(0)).toBe(0)
    expect(staggerDelayMs(3)).toBe(165)
    expect(staggerDelayMs(10)).toBe(385)
    expect(staggerDelayMs(10, 45, 400)).toBe(400)
  })

  it('clamps negative index to zero', () => {
    expect(staggerDelayMs(-2)).toBe(0)
  })
})
