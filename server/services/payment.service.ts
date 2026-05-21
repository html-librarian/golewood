import type { Payment } from '#shared/types/payment'
import { getBookingCashDue } from '#shared/utils/bonus'
import { desc, eq } from 'drizzle-orm'
import { bookings, listings, payments } from '../db/schema'
import { buildBookingPaymentSplit } from '../utils/booking-payment-split'
import { getDb } from '../utils/db'
import {
  allowYookassaMock,
  paymentsNotConfiguredError,
} from '../utils/dev-guards'
import {
  createYookassaClient,
  formatYookassaAmount,
  mapYookassaStatus,
} from '../utils/yookassa'
import { hostPayoutService } from './host-payout.service'

const mapPayment = (row: typeof payments.$inferSelect): Payment => ({
  id: row.id,
  bookingId: row.bookingId,
  yookassaPaymentId: row.yookassaPaymentId,
  amount: row.amount,
  currency: row.currency,
  status: row.status,
  confirmationUrl: row.confirmationUrl,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const getLatestPayment = async (bookingId: string) => {
  const db = getDb()
  const [row] = await db.select().from(payments)
    .where(eq(payments.bookingId, bookingId))
    .orderBy(desc(payments.createdAt))
    .limit(1)

  return row ? mapPayment(row) : null
}

const getYookassaConfig = () => {
  const config = useRuntimeConfig()
  const shopId = config.yookassaShopId as string
  const secretKey = config.yookassaSecretKey as string
  const keysMissing = !shopId || !secretKey

  return {
    shopId,
    secretKey,
    siteUrl: config.public.siteUrl as string,
    keysMissing,
    useMock: allowYookassaMock(keysMissing),
  }
}

const assertPaymentsAvailable = () => {
  const config = getYookassaConfig()

  if (config.keysMissing && !config.useMock) {
    throw paymentsNotConfiguredError()
  }

  return config
}

const assertGuestOwnsBooking = async (bookingId: string, userId: string) => {
  const db = getDb()
  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  if (booking.guestId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Booking is not payable' })
  }

  return booking
}

const hostPayoutNotReadyError = () =>
  createError({
    statusCode: 409,
    statusMessage: 'HOST_PAYOUT_NOT_READY',
    data: { code: 'HOST_PAYOUT_NOT_READY' },
  })

const getListingHostForBooking = async (listingId: string) => {
  const db = getDb()
  const [listing] = await db.select({
    hostId: listings.hostId,
    title: listings.title,
  }).from(listings).where(eq(listings.id, listingId)).limit(1)

  if (!listing) {
    throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
  }

  return listing
}

const assertHostPayoutReady = async (listingId: string, useMock: boolean) => {
  if (useMock) {
    return getListingHostForBooking(listingId)
  }

  const listing = await getListingHostForBooking(listingId)
  const ready = await hostPayoutService.isReadyForBookingPayments(listing.hostId)

  if (!ready) {
    throw hostPayoutNotReadyError()
  }

  return listing
}

export const paymentService = {
  getForBooking: async (bookingId: string, userId: string) => {
    await assertGuestOwnsBooking(bookingId, userId)
    return getLatestPayment(bookingId)
  },

  getLatestForBooking: getLatestPayment,

  createForBooking: async (bookingId: string, userId: string) => {
    const booking = await assertGuestOwnsBooking(bookingId, userId)
    const existing = await getLatestPayment(bookingId)

    if (existing && ['pending', 'waiting_for_capture', 'succeeded'].includes(existing.status)) {
      if (existing.confirmationUrl && existing.status === 'pending') {
        return { payment: existing, confirmationUrl: existing.confirmationUrl }
      }

      if (['waiting_for_capture', 'succeeded'].includes(existing.status)) {
        throw createError({ statusCode: 409, statusMessage: 'Payment already exists' })
      }
    }

    const { shopId, secretKey, siteUrl, useMock } = assertPaymentsAvailable()
    const returnUrl = `${siteUrl}/bookings/${bookingId}/pay?return=1`
    const db = getDb()
    const cashDue = getBookingCashDue(booking.totalPrice, booking.bonusApplied)

    if (cashDue <= 0) {
      const [row] = await db.insert(payments).values({
        bookingId,
        yookassaPaymentId: `bonus-${crypto.randomUUID()}`,
        amount: 0,
        status: 'succeeded',
        confirmationUrl: null,
      }).returning()

      return {
        payment: mapPayment(row),
        confirmationUrl: null,
      }
    }

    const listing = await assertHostPayoutReady(booking.listingId, useMock)
    const payoutProfile = await hostPayoutService.getForUser(listing.hostId)

    if (useMock) {
      const [row] = await db.insert(payments).values({
        bookingId,
        yookassaPaymentId: `mock-${crypto.randomUUID()}`,
        amount: cashDue,
        status: 'waiting_for_capture',
        confirmationUrl: returnUrl,
      }).returning()

      return {
        payment: mapPayment(row),
        confirmationUrl: returnUrl,
      }
    }

    const recipientId = payoutProfile.yookassaRecipientId

    if (!recipientId) {
      throw hostPayoutNotReadyError()
    }

    const split = buildBookingPaymentSplit({
      bookingId,
      hostAmount: booking.hostAmount,
      platformFee: booking.platformFee,
      totalPrice: booking.totalPrice,
      cashDue,
      yookassaRecipientId: recipientId,
      hostLegalName: listing.title,
    })

    const client = createYookassaClient(shopId, secretKey)
    const idempotenceKey = crypto.randomUUID()
    const yookassaPayment = await client.createPayment({
      amount: formatYookassaAmount(cashDue),
      capture: false,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: split.description,
      metadata: { bookingId },
      transfers: split.transfers,
    }, idempotenceKey)

    const confirmationUrl = yookassaPayment.confirmation?.confirmation_url

    if (!confirmationUrl) {
      throw createError({ statusCode: 502, statusMessage: 'Missing confirmation URL' })
    }

    const [row] = await db.insert(payments).values({
      bookingId,
      yookassaPaymentId: yookassaPayment.id,
      amount: cashDue,
      status: mapYookassaStatus(yookassaPayment.status),
      confirmationUrl,
    }).returning()

    return {
      payment: mapPayment(row),
      confirmationUrl,
    }
  },

  handleWebhook: async (event: string, object: {
    id: string
    status: string
    metadata?: Record<string, string>
  }) => {
    const db = getDb()
    const [row] = await db.select().from(payments)
      .where(eq(payments.yookassaPaymentId, object.id))
      .limit(1)

    if (!row) {
      return null
    }

    if (event === 'payment.waiting_for_capture') {
      const [updated] = await db.update(payments)
        .set({ status: 'waiting_for_capture', updatedAt: new Date() })
        .where(eq(payments.id, row.id))
        .returning()

      return mapPayment(updated)
    }

    if (event === 'payment.succeeded') {
      const [updated] = await db.update(payments)
        .set({ status: 'succeeded', updatedAt: new Date() })
        .where(eq(payments.id, row.id))
        .returning()

      return mapPayment(updated)
    }

    if (event === 'payment.canceled') {
      const [updated] = await db.update(payments)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(payments.id, row.id))
        .returning()

      return mapPayment(updated)
    }

    if (event === 'refund.succeeded') {
      const [updated] = await db.update(payments)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(eq(payments.id, row.id))
        .returning()

      return mapPayment(updated)
    }

    return mapPayment(row)
  },

  captureForBooking: async (bookingId: string) => {
    const payment = await getLatestPayment(bookingId)

    if (!payment || payment.status !== 'waiting_for_capture') {
      return payment
    }

    const { shopId, secretKey, useMock } = assertPaymentsAvailable()

    if (useMock) {
      const db = getDb()
      const [updated] = await db.update(payments)
        .set({ status: 'succeeded', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
        .returning()

      return mapPayment(updated)
    }

    if (!payment.yookassaPaymentId) {
      return payment
    }

    const client = createYookassaClient(shopId, secretKey)
    const result = await client.capturePayment(payment.yookassaPaymentId, crypto.randomUUID())
    const db = getDb()
    const [updated] = await db.update(payments)
      .set({ status: mapYookassaStatus(result.status), updatedAt: new Date() })
      .where(eq(payments.id, payment.id))
      .returning()

    return mapPayment(updated)
  },

  cancelOrRefundForBooking: async (bookingId: string, refundAmount?: number) => {
    const payment = await getLatestPayment(bookingId)

    if (!payment) {
      return null
    }

    if (['cancelled', 'refunded'].includes(payment.status)) {
      return payment
    }

    const { shopId, secretKey, useMock } = assertPaymentsAvailable()
    const db = getDb()

    if (useMock) {
      if (payment.status === 'succeeded') {
        const amount = refundAmount ?? payment.amount

        if (amount <= 0) {
          return payment
        }

        const [updated] = await db.update(payments)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(payments.id, payment.id))
          .returning()

        return mapPayment(updated)
      }

      const [updated] = await db.update(payments)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
        .returning()

      return mapPayment(updated)
    }

    if (!payment.yookassaPaymentId) {
      return payment
    }

    const client = createYookassaClient(shopId, secretKey)
    const idempotenceKey = crypto.randomUUID()

    if (payment.status === 'waiting_for_capture') {
      await client.cancelPayment(payment.yookassaPaymentId, idempotenceKey)
      const [updated] = await db.update(payments)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
        .returning()

      return mapPayment(updated)
    }

    if (payment.status === 'succeeded') {
      const amount = Math.min(refundAmount ?? payment.amount, payment.amount)

      if (amount <= 0) {
        return payment
      }

      await client.createRefund(
        payment.yookassaPaymentId,
        formatYookassaAmount(amount),
        idempotenceKey,
      )
      const [updated] = await db.update(payments)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
        .returning()

      return mapPayment(updated)
    }

    return payment
  },

  syncFromReturn: async (bookingId: string, userId: string) => {
    await assertGuestOwnsBooking(bookingId, userId)
    const payment = await getLatestPayment(bookingId)

    if (!payment?.yookassaPaymentId) {
      return payment
    }

    const { shopId, secretKey, useMock } = assertPaymentsAvailable()

    if (useMock) {
      return payment
    }

    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64')
    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${payment.yookassaPaymentId}`,
      { headers: { Authorization: `Basic ${auth}` } },
    )

    if (!response.ok) {
      return payment
    }

    const data = await response.json()
    const db = getDb()
    const [updated] = await db.update(payments)
      .set({ status: mapYookassaStatus(data.status), updatedAt: new Date() })
      .where(eq(payments.id, payment.id))
      .returning()

    return mapPayment(updated)
  },
}
