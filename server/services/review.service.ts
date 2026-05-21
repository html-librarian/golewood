import type {
  HostListingReviewsResponse,
  ListingReviewsResponse,
  Review,
  ReviewEligibility,
  ReviewEligibilityReason,
  ReviewPhoto,
  ReviewPublic,
  ReviewReply,
  ReviewReplyAuthorRole,
  ReviewStayMeta,
} from '#shared/types/review'
import type { ReviewRatings } from '#shared/types/review-ratings'
import type { CreateReviewInput } from '#shared/schemas/review'
import type { CreateReviewReplyInput } from '#shared/schemas/review-reply'
import { averageReviewRatings, computeOverallRating, roundReviewScore } from '#shared/utils/review-rating'
import { buildReviewReplyTree } from '#shared/utils/review-replies'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { bookings, listings, reviewPhotos, reviewReplies, reviews, users } from '../db/schema'
import { getDb } from '../utils/db'
import { processReviewPhoto } from '../utils/image'
import { saveReviewPhoto } from '../utils/storage'
import { REVIEW_PHOTO_MAX_BYTES, REVIEW_PHOTO_MAX_COUNT } from '#shared/utils/media-limits'
import { isBookingReviewable } from '#shared/utils/booking-review'
import { bookingService } from './booking.service'
import { bonusService } from './bonus.service'

const mapRatingsFromRow = (row: typeof reviews.$inferSelect): ReviewRatings => ({
  cleanliness: row.ratingCleanliness,
  checkIn: row.ratingCheckIn,
  location: row.ratingLocation,
  photoMatch: row.ratingPhotoMatch,
  value: row.ratingValue,
  service: row.ratingService,
})

const mapReview = (row: typeof reviews.$inferSelect): Review => ({
  id: row.id,
  bookingId: row.bookingId,
  listingId: row.listingId,
  authorId: row.authorId,
  rating: row.rating,
  ratings: mapRatingsFromRow(row),
  text: row.text,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const mapReviewPhoto = (row: typeof reviewPhotos.$inferSelect): ReviewPhoto => ({
  id: row.id,
  url: row.url,
  sortOrder: row.sortOrder,
})

const nightsBetween = (checkIn: Date, checkOut: Date) => {
  const ms = checkOut.getTime() - checkIn.getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

const mapStayMeta = (
  checkIn: Date | null | undefined,
  checkOut: Date | null | undefined,
  guests: number | null | undefined,
): ReviewStayMeta | null => {
  if (!checkIn || !checkOut) {
    return null
  }

  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
    guests: guests ?? 1,
    nights: nightsBetween(checkIn, checkOut),
  }
}

const getReviewPhotos = async (reviewIds: string[]) => {
  if (!reviewIds.length) {
    return {} as Record<string, ReviewPhoto[]>
  }

  const db = getDb()
  const rows = await db.select().from(reviewPhotos)
    .where(inArray(reviewPhotos.reviewId, reviewIds))
    .orderBy(asc(reviewPhotos.sortOrder))

  const grouped: Record<string, ReviewPhoto[]> = {}

  for (const row of rows) {
    const photo = mapReviewPhoto(row)
    grouped[row.reviewId] = grouped[row.reviewId] ?? []
    grouped[row.reviewId].push(photo)
  }

  return grouped
}

const mapReviewPublic = (
  row: typeof reviews.$inferSelect,
  authorName: string | null,
  photos: ReviewPhoto[] = [],
  stay: ReviewStayMeta | null = null,
  replies: ReviewReply[] = [],
): ReviewPublic => ({
  id: row.id,
  rating: row.rating,
  ratings: mapRatingsFromRow(row),
  text: row.text,
  authorName,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  photos,
  stay,
  replies,
})

const getRepliesForReviews = async (
  reviewRows: Array<{ review: typeof reviews.$inferSelect, hostId: string }>,
) => {
  if (!reviewRows.length) {
    return {} as Record<string, ReviewReply[]>
  }

  const reviewIds = reviewRows.map(({ review }) => review.id)
  const db = getDb()
  const replyRows = await db.select({
    reply: reviewReplies,
    authorName: users.name,
  })
    .from(reviewReplies)
    .innerJoin(users, eq(reviewReplies.authorId, users.id))
    .where(inArray(reviewReplies.reviewId, reviewIds))
    .orderBy(asc(reviewReplies.createdAt))

  const hostIdByReview = Object.fromEntries(
    reviewRows.map(({ review, hostId }) => [review.id, hostId]),
  )

  const flat: Array<ReviewReply & { reviewId: string }> = replyRows.map(({ reply, authorName }) => {
    const hostId = hostIdByReview[reply.reviewId]
    const authorRole: ReviewReplyAuthorRole = reply.authorId === hostId ? 'host' : 'guest'

    return {
      id: reply.id,
      reviewId: reply.reviewId,
      parentReplyId: reply.parentReplyId,
      authorId: reply.authorId,
      authorRole,
      authorName,
      text: reply.text,
      createdAt: reply.createdAt.toISOString(),
      children: [],
    }
  })

  const grouped: Record<string, ReviewReply[]> = {}

  for (const reviewId of reviewIds) {
    grouped[reviewId] = buildReviewReplyTree(flat.filter(item => item.reviewId === reviewId))
  }

  return grouped
}

export const reviewService = {
  listForListing: async (listingId: string): Promise<ListingReviewsResponse> => {
    const db = getDb()
    const rows = await db.select({
      review: reviews,
      authorName: users.name,
      hostId: listings.hostId,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      guests: bookings.guests,
    })
      .from(reviews)
      .innerJoin(users, eq(reviews.authorId, users.id))
      .innerJoin(bookings, eq(reviews.bookingId, bookings.id))
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(and(eq(reviews.listingId, listingId), eq(reviews.status, 'approved')))
      .orderBy(desc(reviews.createdAt))

    const photoMap = await getReviewPhotos(rows.map(({ review }) => review.id))
    const replyMap = await getRepliesForReviews(
      rows.map(({ review, hostId }) => ({ review, hostId })),
    )
    const publicReviews = rows.map(({ review, authorName, checkIn, checkOut, guests }) =>
      mapReviewPublic(
        review,
        authorName,
        photoMap[review.id] ?? [],
        mapStayMeta(checkIn, checkOut, guests),
        replyMap[review.id] ?? [],
      ),
    )

    const ratingBreakdown = averageReviewRatings(publicReviews.map(review => review.ratings))
    const averageRating = ratingBreakdown?.overall
      ?? (publicReviews.length
        ? roundReviewScore(publicReviews.reduce((sum, item) => sum + item.rating, 0) / publicReviews.length)
        : null)

    return {
      reviews: publicReviews,
      averageRating,
      ratingBreakdown,
      totalCount: publicReviews.length,
    }
  },

  getSummariesForListings: async (listingIds: string[]) => {
    if (!listingIds.length) {
      return {} as Record<string, { averageRating: number, reviewCount: number }>
    }

    const db = getDb()
    const rows = await db.select({
      listingId: reviews.listingId,
      averageRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)`,
      reviewCount: sql<number>`count(*)::int`,
    })
      .from(reviews)
      .where(and(inArray(reviews.listingId, listingIds), eq(reviews.status, 'approved')))
      .groupBy(reviews.listingId)

    return Object.fromEntries(rows.map(row => [
      row.listingId,
      {
        averageRating: Number(row.averageRating),
        reviewCount: Number(row.reviewCount),
      },
    ]))
  },

  getEligibility: async (listingId: string, userId: string, preferredBookingId?: string): Promise<ReviewEligibility> => {
    const db = getDb()

    const resolveIneligibleReason = async (bookingId: string): Promise<ReviewEligibilityReason> => {
      const [booking] = await db.select({
        listingId: bookings.listingId,
        guestId: bookings.guestId,
        status: bookings.status,
        checkOut: bookings.checkOut,
      })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)

      if (!booking || booking.listingId !== listingId || booking.guestId !== userId) {
        return 'no_booking'
      }

      const [existing] = await db.select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.bookingId, bookingId))
        .limit(1)

      if (existing) {
        return 'already_reviewed'
      }

      const checkOut = booking.checkOut.toISOString().slice(0, 10)

      if (!isBookingReviewable(booking.status, checkOut)) {
        return 'stay_in_progress'
      }

      return 'no_booking'
    }

    const isBookingEligible = async (bookingId: string) => {
      const [booking] = await db.select({
        id: bookings.id,
        listingId: bookings.listingId,
        guestId: bookings.guestId,
        status: bookings.status,
        checkOut: bookings.checkOut,
      })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)

      if (!booking || booking.listingId !== listingId || booking.guestId !== userId) {
        return false
      }

      const checkOut = booking.checkOut.toISOString().slice(0, 10)

      if (!isBookingReviewable(booking.status, checkOut)) {
        return false
      }

      const [existing] = await db.select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.bookingId, bookingId))
        .limit(1)

      if (existing) {
        return false
      }

      if (booking.status === 'confirmed') {
        await bookingService.autoCompletePastStayIfDue(bookingId)
      }

      return true
    }

    if (preferredBookingId) {
      if (await isBookingEligible(preferredBookingId)) {
        return { bookingId: preferredBookingId }
      }

      return {
        bookingId: null,
        reason: await resolveIneligibleReason(preferredBookingId),
      }
    }

    const candidateBookings = await db.select({ id: bookings.id })
      .from(bookings)
      .where(and(
        eq(bookings.listingId, listingId),
        eq(bookings.guestId, userId),
        inArray(bookings.status, ['confirmed', 'completed']),
      ))
      .orderBy(desc(bookings.checkOut))

    for (const booking of candidateBookings) {
      if (await isBookingEligible(booking.id)) {
        return { bookingId: booking.id }
      }
    }

    return { bookingId: null }
  },

  create: async (bookingId: string, userId: string, input: CreateReviewInput): Promise<Review> => {
    const db = getDb()
    const [booking] = await db.select().from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      throw createError({ statusCode: 404, statusMessage: 'Booking not found', data: { code: 'not_found' } })
    }

    if (booking.guestId !== userId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden', data: { code: 'forbidden' } })
    }

    const checkOut = booking.checkOut.toISOString().slice(0, 10)

    if (!isBookingReviewable(booking.status, checkOut)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Review allowed only after finished stay (status: ${booking.status})`,
        data: { code: 'not_completed', status: booking.status },
      })
    }

    if (booking.status === 'confirmed') {
      await bookingService.autoCompletePastStayIfDue(bookingId)
    }

    if (booking.status !== 'completed') {
      const [fresh] = await db.select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)

      if (fresh?.status !== 'completed') {
        throw createError({
          statusCode: 400,
          statusMessage: `Review allowed only after completed stay (status: ${fresh?.status ?? booking.status})`,
          data: { code: 'not_completed', status: fresh?.status ?? booking.status },
        })
      }
    }

    const [existing] = await db.select().from(reviews)
      .where(eq(reviews.bookingId, bookingId))
      .limit(1)

    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Review already exists' })
    }

    const overallRating = Math.round(computeOverallRating(input.ratings))

    const [row] = await db.insert(reviews).values({
      bookingId,
      listingId: booking.listingId,
      authorId: userId,
      rating: overallRating,
      ratingCleanliness: input.ratings.cleanliness,
      ratingCheckIn: input.ratings.checkIn,
      ratingLocation: input.ratings.location,
      ratingPhotoMatch: input.ratings.photoMatch,
      ratingValue: input.ratings.value,
      ratingService: input.ratings.service,
      text: input.text,
      status: 'pending',
    }).returning()

    return mapReview(row)
  },

  listPending: async () => {
    const db = getDb()
    const rows = await db.select({
      review: reviews,
      listingTitle: listings.title,
      authorName: users.name,
    })
      .from(reviews)
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .innerJoin(users, eq(reviews.authorId, users.id))
      .where(eq(reviews.status, 'pending'))
      .orderBy(desc(reviews.createdAt))

    return rows.map(({ review, listingTitle, authorName }) => ({
      ...mapReview(review),
      listingTitle,
      authorName,
    }))
  },

  updateStatus: async (reviewId: string, status: 'approved' | 'rejected') => {
    const db = getDb()
    const [row] = await db.select().from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Review not found' })
    }

    if (row.status !== 'pending') {
      throw createError({ statusCode: 400, statusMessage: 'Review is not pending' })
    }

    const [updated] = await db.update(reviews)
      .set({ status, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning()

    if (status === 'approved') {
      await bonusService.creditForApprovedReview(reviewId)
    }

    return mapReview(updated)
  },

  addPhoto: async (reviewId: string, userId: string, file: { data: Buffer, filename?: string, type?: string }) => {
    const db = getDb()
    const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1)

    if (!review) {
      throw createError({ statusCode: 404, statusMessage: 'Review not found' })
    }

    if (review.authorId !== userId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (file.data.length > REVIEW_PHOTO_MAX_BYTES) {
      throw createError({ statusCode: 400, statusMessage: 'Photo is too large' })
    }

    const existing = await getReviewPhotos([reviewId])
    const count = existing[reviewId]?.length ?? 0

    if (count >= REVIEW_PHOTO_MAX_COUNT) {
      throw createError({ statusCode: 400, statusMessage: 'Photo limit reached' })
    }

    const processed = await processReviewPhoto(file.data, file.filename)
    const url = await saveReviewPhoto(reviewId, processed)

    const [row] = await db.insert(reviewPhotos).values({
      reviewId,
      url,
      sortOrder: count,
    }).returning()

    return mapReviewPhoto(row)
  },

  listForHostListing: async (listingId: string, hostUserId: string): Promise<HostListingReviewsResponse> => {
    const db = getDb()
    const [listing] = await db.select({ hostId: listings.hostId })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1)

    if (!listing || listing.hostId !== hostUserId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const rows = await db.select({
      review: reviews,
      authorName: users.name,
      hostId: listings.hostId,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      guests: bookings.guests,
    })
      .from(reviews)
      .innerJoin(users, eq(reviews.authorId, users.id))
      .innerJoin(bookings, eq(reviews.bookingId, bookings.id))
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(eq(reviews.listingId, listingId))
      .orderBy(desc(reviews.createdAt))

    const photoMap = await getReviewPhotos(rows.map(({ review }) => review.id))
    const approvedRows = rows.filter(({ review }) => review.status === 'approved')
    const replyMap = await getRepliesForReviews(
      approvedRows.map(({ review, hostId }) => ({ review, hostId })),
    )

    const approved = approvedRows.map(({ review, authorName, checkIn, checkOut, guests }) =>
      mapReviewPublic(
        review,
        authorName,
        photoMap[review.id] ?? [],
        mapStayMeta(checkIn, checkOut, guests),
        replyMap[review.id] ?? [],
      ),
    )

    const pending = rows
      .filter(({ review }) => review.status === 'pending')
      .map(({ review, authorName, checkIn, checkOut, guests }) => ({
        ...mapReviewPublic(
          review,
          authorName,
          photoMap[review.id] ?? [],
          mapStayMeta(checkIn, checkOut, guests),
          [],
        ),
        status: review.status,
      }))

    return { approved, pending }
  },

  createReply: async (reviewId: string, userId: string, input: CreateReviewReplyInput) => {
    const db = getDb()
    const [reviewRow] = await db.select({
      review: reviews,
      hostId: listings.hostId,
    })
      .from(reviews)
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (!reviewRow) {
      throw createError({ statusCode: 404, statusMessage: 'Review not found' })
    }

    if (reviewRow.review.status !== 'approved') {
      throw createError({ statusCode: 400, statusMessage: 'Replies are only allowed on published reviews' })
    }

    const isHost = reviewRow.hostId === userId
    const isGuestAuthor = reviewRow.review.authorId === userId

    if (!input.parentReplyId) {
      if (!isHost) {
        throw createError({ statusCode: 403, statusMessage: 'Only the host can start a reply thread' })
      }
    } else {
      const [parent] = await db.select({
        reply: reviewReplies,
        authorName: users.name,
      })
        .from(reviewReplies)
        .innerJoin(users, eq(reviewReplies.authorId, users.id))
        .where(and(
          eq(reviewReplies.id, input.parentReplyId),
          eq(reviewReplies.reviewId, reviewId),
        ))
        .limit(1)

      if (!parent) {
        throw createError({ statusCode: 404, statusMessage: 'Parent reply not found' })
      }

      const parentIsHost = parent.reply.authorId === reviewRow.hostId

      if (parentIsHost && !isGuestAuthor) {
        throw createError({ statusCode: 403, statusMessage: 'Only the guest author can reply to the host' })
      }

      if (!parentIsHost && !isHost) {
        throw createError({ statusCode: 403, statusMessage: 'Only the host can reply to the guest' })
      }

      if (parent.reply.authorId === userId) {
        throw createError({ statusCode: 403, statusMessage: 'Cannot reply to your own message' })
      }
    }

    const [inserted] = await db.insert(reviewReplies).values({
      reviewId,
      parentReplyId: input.parentReplyId ?? null,
      authorId: userId,
      text: input.text,
    }).returning()

    const authorRole: ReviewReplyAuthorRole = isHost ? 'host' : 'guest'
    const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1)

    return {
      id: inserted.id,
      reviewId: inserted.reviewId,
      parentReplyId: inserted.parentReplyId,
      authorId: inserted.authorId,
      authorRole,
      authorName: author?.name ?? null,
      text: inserted.text,
      createdAt: inserted.createdAt.toISOString(),
      children: [],
    } satisfies ReviewReply
  },
}
