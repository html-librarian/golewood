import type { CreatePaymentResult, Payment } from '#shared/types/payment'
import { authorizationHeaders } from '#shared/utils/auth-headers'

export const usePayments = () => {
  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const createPayment = (bookingId: string) =>
    $fetch<CreatePaymentResult>(`/api/bookings/${bookingId}/payment`, {
      method: 'POST',
      headers: authHeaders(),
    })

  const fetchPayment = (bookingId: string, sync = false) =>
    $fetch<Payment | null>(`/api/bookings/${bookingId}/payment`, {
      headers: authHeaders(),
      query: sync ? { return: '1' } : undefined,
    })

  return {
    createPayment,
    fetchPayment,
  }
}
