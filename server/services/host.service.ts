import type { HostDashboardStats, HostPublicProfile } from '#shared/types/host'
import { chartPeriodStart, sumSeries } from '#shared/utils/chart-buckets'
import { and, count, eq, gte, inArray, sql } from 'drizzle-orm'
import { bookings, listings, payments, reviews, users } from '../db/schema'
import { dayBucket, toDailyChartSeries } from '../utils/daily-chart-series'
import { getDb } from '../utils/db'
import type { UpdateHostProfileDescriptionInput } from '#shared/schemas/host-profile'
import { hostVerificationService } from './host-verification.service'
import { listingNewsService } from './listing-news.service'
import { listingService } from './listing.service'

const PAID_BOOKING_STATUSES = ['confirmed', 'completed'] as const

export const hostService = {
  getPublicProfile: async (hostId: string): Promise<HostPublicProfile> => {
    const db = getDb()
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      hostProfileDescription: users.hostProfileDescription,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, hostId)).limit(1)

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'Host not found' })
    }

    const hostListings = await listingService.listPublishedByHost(hostId)

    const [ratingRow] = await db.select({
      averageRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)`,
      reviewCount: sql<number>`count(*)::int`,
    })
      .from(reviews)
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(and(eq(listings.hostId, hostId), eq(reviews.status, 'approved')))

    const verification = await hostVerificationService.getPublicForHost(hostId)
    const news = await listingNewsService.listPublishedForHost(hostId)
    const description = user.hostProfileDescription.trim()

    return {
      id: user.id,
      name: user.name,
      profileDescription: description.length ? description : null,
      memberSince: user.createdAt.toISOString().slice(0, 10),
      listingsCount: hostListings.length,
      averageRating: ratingRow?.reviewCount ? Number(ratingRow.averageRating) : null,
      reviewCount: Number(ratingRow?.reviewCount ?? 0),
      verification,
      listings: hostListings,
      news,
    }
  },

  getDashboardStats: async (hostId: string): Promise<HostDashboardStats> => {
    const db = getDb()
    const chartSince = chartPeriodStart()
    const hostListing = eq(listings.hostId, hostId)

    const [
      [publishedRow],
      [draftRow],
      [moderationRow],
      [archivedRow],
      [pendingBookingsRow],
      [upcomingBookingsRow],
      [ratingRow],
      earningsRows,
      bookingsRows,
      paidBookings30Row,
    ] = await Promise.all([
      db.select({ count: count() }).from(listings).where(and(hostListing, eq(listings.status, 'published'))),
      db.select({ count: count() }).from(listings).where(and(hostListing, eq(listings.status, 'draft'))),
      db.select({ count: count() }).from(listings).where(and(hostListing, eq(listings.status, 'moderation'))),
      db.select({ count: count() }).from(listings).where(and(hostListing, eq(listings.status, 'archived'))),
      db.select({ count: count() }).from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(and(hostListing, eq(bookings.status, 'pending'))),
      db.select({ count: count() }).from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(and(hostListing, inArray(bookings.status, ['pending', 'confirmed']))),
      db.select({
        averageRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)`,
        reviewCount: sql<number>`count(*)::int`,
      })
        .from(reviews)
        .innerJoin(listings, eq(reviews.listingId, listings.id))
        .where(and(hostListing, eq(reviews.status, 'approved'))),
      db.select({
        date: dayBucket(payments.createdAt),
        value: sql<number>`coalesce(sum(${bookings.hostAmount}), 0)::int`,
      })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .innerJoin(payments, eq(payments.bookingId, bookings.id))
        .where(and(
          hostListing,
          eq(payments.status, 'succeeded'),
          inArray(bookings.status, [...PAID_BOOKING_STATUSES]),
          gte(payments.createdAt, chartSince),
        ))
        .groupBy(sql`date_trunc('day', ${payments.createdAt})`),
      db.select({
        date: dayBucket(bookings.createdAt),
        value: sql<number>`count(*)::int`,
      })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(and(hostListing, gte(bookings.createdAt, chartSince)))
        .groupBy(sql`date_trunc('day', ${bookings.createdAt})`),
      db.select({ count: count() })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .innerJoin(payments, eq(payments.bookingId, bookings.id))
        .where(and(
          hostListing,
          eq(payments.status, 'succeeded'),
          inArray(bookings.status, [...PAID_BOOKING_STATUSES]),
          gte(payments.createdAt, chartSince),
        )),
    ])

    const earningsByDay = toDailyChartSeries(earningsRows)
    const bookingsByDay = toDailyChartSeries(bookingsRows)

    return {
      listingsPublished: publishedRow.count,
      listingsDraft: draftRow.count,
      listingsModeration: moderationRow.count,
      listingsArchived: archivedRow.count,
      bookingsPending: pendingBookingsRow.count,
      bookingsUpcoming: upcomingBookingsRow.count,
      analytics: {
        earningsLast30DaysRub: sumSeries(earningsByDay),
        paidBookingsLast30Days: paidBookings30Row.count,
        bookingsCreatedLast30Days: sumSeries(bookingsByDay),
        averageRating: ratingRow?.reviewCount
          ? Number(ratingRow.averageRating)
          : null,
        approvedReviews: Number(ratingRow?.reviewCount ?? 0),
      },
      charts: {
        earningsByDay,
        bookingsByDay,
      },
    }
  },

  updateProfileDescription: async (hostId: string, input: UpdateHostProfileDescriptionInput) => {
    const db = getDb()
    const description = input.description.trim()

    const [row] = await db.update(users)
      .set({
        hostProfileDescription: description,
        updatedAt: new Date(),
      })
      .where(eq(users.id, hostId))
      .returning({ hostProfileDescription: users.hostProfileDescription })

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Host not found' })
    }

    const saved = row.hostProfileDescription.trim()

    return { profileDescription: saved.length ? saved : null }
  },
}
