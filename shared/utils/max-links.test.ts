import { describe, expect, it } from 'vitest'
import {
  buildMaxBookingStartapp,
  buildMaxBotDeepLink,
  buildMaxLinkStartParam,
  buildMaxMiniAppUrl,
  parseMaxBotStart,
} from './max-links'

describe('max-links', () => {
  it('builds bot deep link with start param', () => {
    expect(buildMaxBotDeepLink('golewood_bot', 'link_ABC123')).toBe(
      'https://max.ru/golewood_bot?start=link_ABC123',
    )
  })

  it('parses booking and link start intents', () => {
    const bookingId = '11111111-2222-4333-8444-555555555555'
    expect(parseMaxBotStart(`booking_${bookingId}`)).toEqual({
      kind: 'booking',
      bookingId,
    })
    expect(parseMaxBotStart('bookings')).toEqual({ kind: 'bookings' })
    expect(parseMaxBotStart('link_deadbeef')).toEqual({ kind: 'link', code: 'deadbeef' })
  })

  it('builds mini-app url with startapp', () => {
    const id = '11111111-2222-4333-8444-555555555555'
    expect(buildMaxMiniAppUrl('https://golewood.ru', buildMaxBookingStartapp(id))).toBe(
      `https://golewood.ru/max?startapp=booking_${id}`,
    )
  })

  it('normalizes link code for start param', () => {
    expect(buildMaxLinkStartParam('GW-AB12CD')).toBe('link_AB12CD')
  })
})
