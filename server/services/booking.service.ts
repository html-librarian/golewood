import type { Booking, BookingWithListing } from '#shared/types/booking'
import type { Payment } from '#shared/types/payment'
import type { CreateBookingInput } from '#shared/schemas/booking'
import { countNights, parseDate, canCompleteBooking } from '#shared/utils/dates'
import { isBookingReviewable } from '#shared/utils/booking-review'
import { resolveTransferCharge } from '#shared/utils/listing-transfer'
import { getListingGuestCapacity } from '#shared/utils/listing-extra-guests'
import { calculateBookingPrice, splitBookingSettlement } from '#shared/utils/pricing'
import { calculateRefund } from '#shared/utils/refund'
import type { CancellationPolicy } from '#shared/types/listing'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { bookings, listings, reviews } from '../db/schema'
import { getDb } from '../utils/db'
import { acquireLock, bookingLockKey, releaseLock } from '../utils/lock'
import { calendarService, getListingCoverPhoto } from './calendar.service'
import { notificationService } from './notification.service'
import { bonusService } from './bonus.service'
import { hostPromoService } from './host-promo.service'
import { paymentService } from './payment.service'
import { giftCertificateService } from './gift-certificate.service'

const mapBooking = (row: typeof bookings.$inferSelect): Booking => ({
  id: row.id,
  listingId: row.listingId,
  guestId: row.guestId,
  checkIn: row.checkIn.toISOString().slice(0, 10),
  checkOut: row.checkOut.toISOString().slice(0, 10),
  guests: row.guests,
  totalPrice: row.totalPrice,
  hostAmount: row.hostAmount,
  platformFee: row.platformFee,
  bonusApplied: row.bonusApplied,
  giftCertificateCredit: row.giftCertificateCredit,
  transferRequested: row.transferRequested,
  transferPrice: row.transferPrice,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const toBookingWithListing = async (row: typeof bookings.$inferSelect): Promise<BookingWithListing> => {
  const db = getDb()
  const [listing] = await db.select({
    id: listings.id,
    title: listings.title,
    city: listings.city,
    cancellationPolicy: listings.cancellationPolicy,
  }).from(listings).where(eq(listings.id, row.listingId)).limit(1)

  const payment: Payment | null = await paymentService.getLatestForBooking(row.id)
  const checkIn = row.checkIn.toISOString().slice(0, 10)
  const policy = (listing?.cancellationPolicy ?? 'moderate') as CancellationPolicy

  const refundPreview = ['pending', 'confirmed'].includes(row.status)
    && payment && ['waiting_for_capture', 'succeeded'].includes(payment.status)
    ? calculateRefund(row.totalPrice, policy, checkIn)
    : null

  return {
    ...mapBooking(row),
    listing: {
      id: listing?.id ?? row.listingId,
      title: listing?.title ?? 'Listing',
      city: listing?.city ?? '',
      coverPhotoUrl: await getListingCoverPhoto(row.listingId),
      cancellationPolicy: policy,
    },
    payment,
    refundPreview: refundPreview
      ? { amount: refundPreview.refundAmount, percent: refundPreview.refundPercent }
      : null,
  }
}

export const bookingService = {
  create: async (guestId: string, input: CreateBookingInput): Promise<BookingWithListing> => {
    const db = getDb()
    const [listing] = await db.select().from(listings)
      .where(and(eq(listings.id, input.listingId), eq(listings.status, 'published')))
      .limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    if (listing.kind === 'property') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Choose a specific unit to book — this is a property complex page',
      })
    }

    if (listing.managedByTeam) {
      throw createError({ statusCode: 400, statusMessage: 'Online booking is not available for this listing yet' })
    }

    const guestCapacity = getListingGuestCapacity(listing)

    if (input.guests > guestCapacity) {
      throw createError({ statusCode: 400, statusMessage: 'Too many guests' })
    }

    if (input.guests > listing.maxGuests && !listing.extraGuestsOffered) {
      throw createError({ statusCode: 400, statusMessage: 'Extra guests are not available for this listing' })
    }

    if (listing.hostId === guestId) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot book your own listing' })
    }

    const lockKey = bookingLockKey(input.listingId, input.checkIn, input.checkOut)
    const locked = await acquireLock(lockKey)

    if (!locked) {
      throw createError({ statusCode: 409, statusMessage: 'Booking in progress for these dates' })
    }

    try {
      await calendarService.assertRangeAvailable(input.listingId, input.checkIn, input.checkOut)

      if (input.includeTransfer && !listing.transferOffered) {
        throw createError({ statusCode: 400, statusMessage: 'Transfer is not available for this listing' })
      }

      const nights = countNights(input.checkIn, input.checkOut)
      const transferCharge = resolveTransferCharge(
        listing.transferOffered,
        listing.transferPriceOnRequest,
        listing.transferPrice,
        input.includeTransfer,
      )

      const pricing = calculateBookingPrice(nights, listing.pricePerNight, {
        transferPrice: transferCharge,
        transferOnRequest: input.includeTransfer && listing.transferPriceOnRequest,
        guests: input.guests,
        maxGuestsIncluded: listing.maxGuests,
        extraGuestPricePerNight: listing.extraGuestsOffered
          ? (listing.extraGuestPricePerNight ?? 0)
          : 0,
      })

      let giftCertificateCredit = 0
      let giftCertificatePurchaseId: string | null = null

      if (input.giftCertificateCode) {
        const redemption = await giftCertificateService.resolveRedemption(
          input.giftCertificateCode,
          input.listingId,
        )
        giftCertificateCredit = Math.min(redemption.creditRub, pricing.total)
        giftCertificatePurchaseId = redemption.purchaseId
      }

      const totalPrice = Math.max(0, pricing.total - giftCertificateCredit)
      const pricedAfterCert = {
        ...pricing,
        total: totalPrice,
        serviceFee: totalPrice > 0
          ? Math.round((pricing.serviceFee * totalPrice) / pricing.total)
          : 0,
      }
      const { hostAmount, platformFee } = splitBookingSettlement(pricedAfterCert)
      const bonusApplied = await bonusService.resolveBonusToApply(guestId, totalPrice, input.bonusToApply ?? 0)

      const [row] = await db.insert(bookings).values({
        listingId: input.listingId,
        guestId,
        checkIn: parseDate(input.checkIn),
        checkOut: parseDate(input.checkOut),
        guests: input.guests,
        totalPrice,
        hostAmount,
        platformFee,
        bonusApplied,
        giftCertificatePurchaseId,
        giftCertificateCredit,
        transferRequested: input.includeTransfer,
        transferPrice: transferCharge,
        status: 'pending',
      }).returning()

      if (giftCertificatePurchaseId) {
        await giftCertificateService.markRedeemed(giftCertificatePurchaseId)
      }

      if (bonusApplied > 0) {
        try {
          await bonusService.spendForBooking(guestId, row.id, bonusApplied)
        } catch (error) {
          await db.delete(bookings).where(eq(bookings.id, row.id))
          throw error
        }
      }

      notificationService.notifyBookingCreated({
        hostId: listing.hostId,
        bookingId: row.id,
        listingTitle: listing.title,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
      })

      return toBookingWithListing(row)
    } finally {
      await releaseLock(lockKey)
    }
  },

  listForGuest: async (guestId: string) => {
    const db = getDb()
    const rows = await db.select().from(bookings)
      .where(eq(bookings.guestId, guestId))
      .orderBy(desc(bookings.createdAt))

    const bookingIds = rows.map(row => row.id)
    const reviewedBookingIds = new Set<string>()

    if (bookingIds.length) {
      const existingReviews = await db.select({ bookingId: reviews.bookingId })
        .from(reviews)
        .where(inArray(reviews.bookingId, bookingIds))

      for (const review of existingReviews) {
        reviewedBookingIds.add(review.bookingId)
      }
    }

    return Promise.all(rows.map(async (row) => {
      const booking = await toBookingWithListing(row)
      const checkOut = row.checkOut.toISOString().slice(0, 10)

      return {
        ...booking,
        canReview: isBookingReviewable(row.status, checkOut) && !reviewedBookingIds.has(row.id),
      }
    }))
  },

  getForGuest: async (bookingId: string, guestId: string) => {
    const db = getDb()
    const [row] = await db.select().from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.guestId, guestId)))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
    }

    return toBookingWithListing(row)
  },

  listForHost: async (hostId: string) => {
    const db = getDb()
    const rows = await db.select({ booking: bookings }).from(bookings)
      .innerJoin(listings, eq(bookings.listingId, listings.id))
      .where(eq(listings.hostId, hostId))
      .orderBy(desc(bookings.createdAt))

    return Promise.all(rows.map(({ booking }) => toBookingWithListing(booking)))
  },

  confirm: async (bookingId: string, hostId: string) => {
    const db = getDb()
    const [row] = await db.select({ booking: bookings, hostId: listings.hostId })
      .from(bookings)
      .innerJoin(listings, eq(bookings.listingId, listings.id))
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
    }

    if (row.hostId !== hostId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (row.booking.status !== 'pending') {
      throw createError({ statusCode: 400, statusMessage: 'Booking is not pending' })
    }

    const [updated] = await db.update(bookings)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning()

    await paymentService.captureForBooking(bookingId)

    notificationService.notifyBookingConfirmed({
      guestId: row.booking.guestId,
      bookingId,
      listingTitle: (await db.select({ title: listings.title }).from(listings).where(eq(listings.id, row.booking.listingId)).limit(1))[0]?.title ?? 'Listing',
      checkIn: row.booking.checkIn.toISOString().slice(0, 10),
      checkOut: row.booking.checkOut.toISOString().slice(0, 10),
    })

    return toBookingWithListing(updated)
  },

  cancel: async (bookingId: string, userId: string) => {
    const db = getDb()
    const [row] = await db.select({
      booking: bookings,
      hostId: listings.hostId,
      cancellationPolicy: listings.cancellationPolicy,
    })
      .from(bookings)
      .innerJoin(listings, eq(bookings.listingId, listings.id))
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
    }

    const isGuest = row.booking.guestId === userId
    const isHost = row.hostId === userId

    if (!isGuest && !isHost) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (!['pending', 'confirmed'].includes(row.booking.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Booking cannot be cancelled' })
    }

    const checkIn = row.booking.checkIn.toISOString().slice(0, 10)
    const cashPaid = row.booking.totalPrice - row.booking.bonusApplied
    const { refundAmount } = calculateRefund(
      cashPaid,
      row.cancellationPolicy as CancellationPolicy,
      checkIn,
    )

    const [updated] = await db.update(bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning()

    if (row.booking.bonusApplied > 0) {
      await bonusService.refundForBooking(row.booking.guestId, bookingId, row.booking.bonusApplied)
    }

    await paymentService.cancelOrRefundForBooking(bookingId, refundAmount)

    const listingTitle = (await db.select({ title: listings.title }).from(listings).where(eq(listings.id, row.booking.listingId)).limit(1))[0]?.title ?? 'Listing'
    const dates = {
      listingTitle,
      checkIn: row.booking.checkIn.toISOString().slice(0, 10),
      checkOut: row.booking.checkOut.toISOString().slice(0, 10),
    }

    notificationService.notifyBookingCancelled({
      recipientId: isGuest ? row.hostId : row.booking.guestId,
      bookingId,
      recipientRole: isGuest ? 'host' : 'guest',
      ...dates,
    })

    return toBookingWithListing(updated)
  },

  autoCompletePastStayIfDue: async (bookingId: string) => {
    const db = getDb()
    const [row] = await db.select({ booking: bookings, hostId: listings.hostId })
      .from(bookings)
      .innerJoin(listings, eq(bookings.listingId, listings.id))
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!row || row.booking.status !== 'confirmed') {
      return row?.booking ?? null
    }

    const checkOut = row.booking.checkOut.toISOString().slice(0, 10)

    if (!canCompleteBooking(checkOut)) {
      return row.booking
    }

    const [updated] = await db.update(bookings)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning()

    await hostPromoService.creditBookingReward(row.hostId, row.booking.listingId, row.booking.totalPrice)

    return updated
  },

  complete: async (bookingId: string, hostId: string) => {
    const db = getDb()
    const [row] = await db.select({ booking: bookings, hostId: listings.hostId })
      .from(bookings)
      .innerJoin(listings, eq(bookings.listingId, listings.id))
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
    }

    if (row.hostId !== hostId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (row.booking.status !== 'confirmed') {
      throw createError({ statusCode: 400, statusMessage: 'Booking is not confirmed' })
    }

    const checkOut = row.booking.checkOut.toISOString().slice(0, 10)

    if (!canCompleteBooking(checkOut)) {
      throw createError({ statusCode: 400, statusMessage: 'Stay is not finished yet' })
    }

    const [updated] = await db.update(bookings)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning()

    await hostPromoService.creditBookingReward(hostId, row.booking.listingId, row.booking.totalPrice)

    return toBookingWithListing(updated)
  },
}
