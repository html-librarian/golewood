import { describe, expect, it } from 'vitest'
import { createBookingSchema } from './booking'
import { searchParamsSchema } from './search'
import { isPaymentPaid } from '../types/payment'
import { countNights } from '../utils/dates'

describe('critical booking flow', () => {
  it('validates search params for listing discovery', () => {
    const params = searchParamsSchema.parse({
      city: 'Moscow',
      checkIn: '2026-07-01',
      checkOut: '2026-07-05',
      guests: 2,
    })

    expect(params.city).toBe('Moscow')
    expect(params.guests).toBe(2)
  })

  it('validates booking creation payload', () => {
    const booking = createBookingSchema.parse({
      listingId: '550e8400-e29b-41d4-a716-446655440000',
      checkIn: '2026-07-01',
      checkOut: '2026-07-05',
      guests: 2,
    })

    expect(countNights(booking.checkIn, booking.checkOut)).toBe(4)
  })

  it('treats hold and succeeded payments as paid', () => {
    expect(isPaymentPaid('waiting_for_capture')).toBe(true)
    expect(isPaymentPaid('succeeded')).toBe(true)
    expect(isPaymentPaid('pending')).toBe(false)
  })
})
