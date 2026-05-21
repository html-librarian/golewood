import { describe, expect, it } from 'vitest'
import { isDevRuntime, isProductionRuntime } from '#shared/utils/runtime-mode'

describe('runtime-mode', () => {
  it('detects production NODE_ENV', () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    expect(isProductionRuntime()).toBe(true)
    expect(isDevRuntime()).toBe(false)
    process.env.NODE_ENV = previous
  })
})
