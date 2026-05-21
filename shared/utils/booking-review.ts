import type { BookingStatus } from '#shared/types/booking'
import { canCompleteBooking } from './dates'

export const isBookingReviewable = (status: BookingStatus, checkOut: string) => {
  if (status === 'cancelled' || status === 'pending') {
    return false
  }

  if (status === 'completed') {
    return true
  }

  if (status === 'confirmed') {
    return canCompleteBooking(checkOut)
  }

  return false
}
