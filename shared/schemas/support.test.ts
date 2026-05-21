import { describe, expect, it } from 'vitest'
import { supportContactSchema } from './support'

describe('supportContactSchema', () => {
  it('accepts valid contact payload', () => {
    const parsed = supportContactSchema.safeParse({
      name: 'Anna',
      email: 'anna@example.com',
      message: 'Need help with booking',
      contextUrl: 'https://golewood.ru/bookings/1',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects short message', () => {
    const parsed = supportContactSchema.safeParse({
      name: 'Anna',
      email: 'anna@example.com',
      message: 'Hi',
    })

    expect(parsed.success).toBe(false)
  })
})
