import { expect, test } from '@playwright/test'
import { getApiToken } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

test.describe('payment webhook', () => {
  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('yookassa webhook marks mock payment as succeeded', async ({ request }) => {
    const token = await getApiToken(request)

    const bookingsRes = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(bookingsRes.ok()).toBeTruthy()

    const bookings = await bookingsRes.json() as Array<{ id: string, status: string }>
    const pending = bookings.find(booking => booking.status === 'pending')
    expect(pending).toBeTruthy()

    const paymentRes = await request.post(`/api/bookings/${pending!.id}/payment`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(paymentRes.ok(), await paymentRes.text()).toBeTruthy()

    const { payment } = await paymentRes.json() as { payment: { yookassaPaymentId: string, status: string } }
    expect(payment.yookassaPaymentId).toBeTruthy()
    expect(['pending', 'waiting_for_capture']).toContain(payment.status)

    const webhookRes = await request.post('/api/payments/yookassa/webhook', {
      data: {
        event: 'payment.succeeded',
        object: {
          id: payment.yookassaPaymentId,
          status: 'succeeded',
        },
      },
    })
    expect(webhookRes.ok(), await webhookRes.text()).toBeTruthy()

    const updatedRes = await request.get(`/api/bookings/${pending!.id}/payment`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(updatedRes.ok()).toBeTruthy()

    const updated = await updatedRes.json() as { status: string }
    expect(updated.status).toBe('succeeded')
  })

  test('cancel booking cancels pending payment', async ({ request }) => {
    const token = await getApiToken(request)

    const bookingsRes = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const bookings = await bookingsRes.json() as Array<{ id: string, status: string, checkIn: string }>
    const pending = bookings.find(booking => booking.status === 'pending' && booking.checkIn.startsWith('2026-08'))

    expect(pending).toBeTruthy()

    const paymentRes = await request.get(`/api/bookings/${pending!.id}/payment`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(paymentRes.ok()).toBeTruthy()

    const cancelRes = await request.patch(`/api/bookings/${pending!.id}/cancel`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(cancelRes.ok(), await cancelRes.text()).toBeTruthy()

    const bookingsAfterRes = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const bookingsAfter = await bookingsAfterRes.json() as Array<{ id: string, status: string, payment: { status: string } | null }>
    const cancelled = bookingsAfter.find(booking => booking.id === pending!.id)

    expect(cancelled?.status).toBe('cancelled')
    expect(cancelled?.payment?.status).toBe('cancelled')
  })

  test('cancel confirmed booking refunds succeeded payment', async ({ request }) => {
    const token = await getApiToken(request)

    const bookingsRes = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const bookings = await bookingsRes.json() as Array<{ id: string, status: string, checkIn: string, payment: { yookassaPaymentId: string | null, status: string } | null }>
    const confirmed = bookings.find(booking =>
      booking.status === 'confirmed' && booking.checkIn.startsWith('2026-09'),
    )

    expect(confirmed).toBeTruthy()
    expect(confirmed!.payment?.status).toBe('waiting_for_capture')

    const webhookRes = await request.post('/api/payments/yookassa/webhook', {
      data: {
        event: 'payment.succeeded',
        object: {
          id: confirmed!.payment!.yookassaPaymentId,
          status: 'succeeded',
        },
      },
    })
    expect(webhookRes.ok()).toBeTruthy()

    const cancelRes = await request.patch(`/api/bookings/${confirmed!.id}/cancel`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(cancelRes.ok(), await cancelRes.text()).toBeTruthy()

    const bookingsAfterRes = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const bookingsAfter = await bookingsAfterRes.json() as Array<{ id: string, status: string, payment: { status: string } | null }>
    const cancelled = bookingsAfter.find(booking => booking.id === confirmed!.id)

    expect(cancelled?.status).toBe('cancelled')
    expect(cancelled?.payment?.status).toBe('refunded')
  })

  test('refund webhook marks payment as refunded', async ({ request }) => {
    const token = await getApiToken(request)

    const bookingsRes = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const bookings = await bookingsRes.json() as Array<{ id: string, status: string, checkIn: string, payment: { yookassaPaymentId: string | null, status: string } | null }>
    const confirmed = bookings.find(booking =>
      booking.status === 'confirmed' && booking.checkIn.startsWith('2026-09'),
    )

    expect(confirmed?.payment?.yookassaPaymentId).toBeTruthy()

    await request.post('/api/payments/yookassa/webhook', {
      data: {
        event: 'payment.succeeded',
        object: {
          id: confirmed!.payment!.yookassaPaymentId,
          status: 'succeeded',
        },
      },
    })

    const refundWebhookRes = await request.post('/api/payments/yookassa/webhook', {
      data: {
        event: 'refund.succeeded',
        object: {
          id: confirmed!.payment!.yookassaPaymentId,
          status: 'succeeded',
        },
      },
    })
    expect(refundWebhookRes.ok()).toBeTruthy()

    const bookingsAfterRes = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const bookingsAfter = await bookingsAfterRes.json() as Array<{ id: string, payment: { status: string } | null }>
    const updated = bookingsAfter.find(booking => booking.id === confirmed!.id)

    expect(updated?.payment?.status).toBe('refunded')
  })
})
