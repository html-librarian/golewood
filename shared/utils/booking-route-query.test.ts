import { describe, expect, it } from 'vitest'
import { parseBookingRouteQuery } from './booking-route-query'

describe('parseBookingRouteQuery', () => {
  it('parses valid check-in, check-out and guests', () => {
    expect(parseBookingRouteQuery({
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      guests: '3',
    })).toEqual({
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      guests: 3,
    })
  })

  it('rejects check-out before check-in', () => {
    expect(parseBookingRouteQuery({
      checkIn: '2026-06-05',
      checkOut: '2026-06-01',
    }).checkOut).toBeNull()
  })

  it('ignores invalid guests', () => {
    expect(parseBookingRouteQuery({ guests: '0' }).guests).toBeNull()
    expect(parseBookingRouteQuery({ guests: 'abc' }).guests).toBeNull()
  })
})
