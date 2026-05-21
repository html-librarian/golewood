import { describe, expect, it, vi } from 'vitest'

describe('dev-guards', () => {
  it('allowAuthDevCode is false in production even with env set', async () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const { allowAuthDevCode, allowYookassaMock } = await import('./dev-guards')

    expect(allowAuthDevCode('0000')).toBe(false)
    expect(allowYookassaMock(true)).toBe(false)

    process.env.NODE_ENV = previous
  })

  it('allowAuthDevCode works in development', async () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    vi.resetModules()
    const { allowAuthDevCode, allowYookassaMock } = await import('./dev-guards')

    expect(allowAuthDevCode('0000')).toBe(true)
    expect(allowYookassaMock(true)).toBe(true)

    process.env.NODE_ENV = previous
  })
})
