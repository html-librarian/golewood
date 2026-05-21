import type { CreateBookingInput } from '#shared/schemas/booking'
import type { BookingWithListing, CalendarDay } from '#shared/types/booking'

export const useBookings = () => {
  const { authHeaders } = useAuth()

  const fetchCalendar = (listingId: string, from: string, to: string) =>
    $fetch<CalendarDay[]>(`/api/listings/${listingId}/calendar`, { query: { from, to } })

  const createBooking = (input: CreateBookingInput) => {
    const idempotencyKey = crypto.randomUUID()

    return $fetch<BookingWithListing>('/api/bookings', {
      method: 'POST',
      headers: {
        ...authHeaders.value,
        'Idempotency-Key': idempotencyKey,
      },
      body: input,
    })
  }

  const fetchGuestBookings = () =>
    $fetch<BookingWithListing[]>('/api/bookings', { headers: authHeaders.value })

  const fetchGuestBookingById = (id: string) =>
    $fetch<BookingWithListing>(`/api/bookings/${id}`, { headers: authHeaders.value })

  const fetchHostBookings = () =>
    $fetch<BookingWithListing[]>('/api/host/bookings', { headers: authHeaders.value })

  const confirmBooking = (id: string) =>
    $fetch<BookingWithListing>(`/api/bookings/${id}/confirm`, {
      method: 'PATCH',
      headers: authHeaders.value,
    })

  const completeBooking = (id: string) =>
    $fetch<BookingWithListing>(`/api/bookings/${id}/complete`, {
      method: 'PATCH',
      headers: authHeaders.value,
    })

  const cancelBooking = (id: string) =>
    $fetch<BookingWithListing>(`/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: authHeaders.value,
    })

  return {
    fetchCalendar,
    createBooking,
    fetchGuestBookings,
    fetchGuestBookingById,
    fetchHostBookings,
    confirmBooking,
    completeBooking,
    cancelBooking,
  }
}
