import type { AdminDashboardStats, AdminMoneyPeriod } from '#shared/types/admin'
import { and, count, eq, gte, inArray, sql } from 'drizzle-orm'
import { chartPeriodStart } from '#shared/utils/chart-buckets'
import { dayBucket, toDailyChartSeries } from '../utils/daily-chart-series'
import {
  bookings,
  giftCertificatePurchases,
  hostPromoPurchases,
  listingClaimRequests,
  listings,
  payments,
  reports,
  reviews,
  users,
} from '../db/schema'
import { getDb } from '../utils/db'

const PAID_BOOKING_STATUSES = ['confirmed', 'completed'] as const

const periodStart = () => {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date
}

const sumBookingPlatformFee = async (since?: Date) => {
  const db = getDb()
  const conditions = [
    eq(payments.status, 'succeeded'),
    inArray(bookings.status, [...PAID_BOOKING_STATUSES]),
  ]

  if (since) {
    conditions.push(gte(bookings.createdAt, since))
  }

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${bookings.platformFee}), 0)::int`,
    })
    .from(bookings)
    .innerJoin(payments, eq(payments.bookingId, bookings.id))
    .where(and(...conditions))

  return row?.total ?? 0
}

const sumGiftCertificateFees = async (since?: Date) => {
  const db = getDb()
  const conditions = [eq(giftCertificatePurchases.status, 'paid')]

  if (since) {
    conditions.push(gte(giftCertificatePurchases.createdAt, since))
  }

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${giftCertificatePurchases.platformFee}), 0)::int`,
    })
    .from(giftCertificatePurchases)
    .where(and(...conditions))

  return row?.total ?? 0
}

const sumPromoPurchases = async (since?: Date) => {
  const db = getDb()
  const conditions = [eq(hostPromoPurchases.status, 'succeeded')]

  if (since) {
    conditions.push(gte(hostPromoPurchases.createdAt, since))
  }

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${hostPromoPurchases.amountRub}), 0)::int`,
    })
    .from(hostPromoPurchases)
    .where(and(...conditions))

  return row?.total ?? 0
}

const countPaidBookings = async (since?: Date) => {
  const db = getDb()
  const conditions = [
    eq(payments.status, 'succeeded'),
    inArray(bookings.status, [...PAID_BOOKING_STATUSES]),
  ]

  if (since) {
    conditions.push(gte(bookings.createdAt, since))
  }

  const [row] = await db
    .select({ count: count() })
    .from(bookings)
    .innerJoin(payments, eq(payments.bookingId, bookings.id))
    .where(and(...conditions))

  return row?.count ?? 0
}

const fetchBookingsByDay = async (since: Date) => {
  const db = getDb()
  const rows = await db
    .select({
      date: dayBucket(bookings.createdAt),
      value: sql<number>`count(*)::int`,
    })
    .from(bookings)
    .where(gte(bookings.createdAt, since))
    .groupBy(sql`date_trunc('day', ${bookings.createdAt})`)
    .orderBy(sql`date_trunc('day', ${bookings.createdAt})`)

  return toDailyChartSeries(rows)
}

const fetchCommissionByDay = async (since: Date) => {
  const db = getDb()
  const rows = await db
    .select({
      date: dayBucket(payments.createdAt),
      value: sql<number>`coalesce(sum(${bookings.platformFee}), 0)::int`,
    })
    .from(bookings)
    .innerJoin(payments, eq(payments.bookingId, bookings.id))
    .where(and(
      eq(payments.status, 'succeeded'),
      inArray(bookings.status, [...PAID_BOOKING_STATUSES]),
      gte(payments.createdAt, since),
    ))
    .groupBy(sql`date_trunc('day', ${payments.createdAt})`)
    .orderBy(sql`date_trunc('day', ${payments.createdAt})`)

  return toDailyChartSeries(rows)
}

const fetchGiftCertificatesByDay = async (since: Date) => {
  const db = getDb()
  const rows = await db
    .select({
      date: dayBucket(giftCertificatePurchases.createdAt),
      value: sql<number>`coalesce(sum(${giftCertificatePurchases.platformFee}), 0)::int`,
    })
    .from(giftCertificatePurchases)
    .where(and(
      eq(giftCertificatePurchases.status, 'paid'),
      gte(giftCertificatePurchases.createdAt, since),
    ))
    .groupBy(sql`date_trunc('day', ${giftCertificatePurchases.createdAt})`)
    .orderBy(sql`date_trunc('day', ${giftCertificatePurchases.createdAt})`)

  return toDailyChartSeries(rows)
}

const fetchPromoByDay = async (since: Date) => {
  const db = getDb()
  const rows = await db
    .select({
      date: dayBucket(hostPromoPurchases.createdAt),
      value: sql<number>`coalesce(sum(${hostPromoPurchases.amountRub}), 0)::int`,
    })
    .from(hostPromoPurchases)
    .where(and(
      eq(hostPromoPurchases.status, 'succeeded'),
      gte(hostPromoPurchases.createdAt, since),
    ))
    .groupBy(sql`date_trunc('day', ${hostPromoPurchases.createdAt})`)
    .orderBy(sql`date_trunc('day', ${hostPromoPurchases.createdAt})`)

  return toDailyChartSeries(rows)
}

export const adminDashboardService = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const db = getDb()
    const since30 = periodStart()
    const chartSince = chartPeriodStart()

    const [
      usersRow,
      hostsRow,
      guestsRow,
      moderationRow,
      archivedRow,
      publishedRow,
      reviewsRow,
      reportsRow,
      claimsRow,
      bookingsTotalRow,
      bookings30Row,
      bookingFeeAll,
      bookingFee30,
      promoAll,
      promo30,
      giftAll,
      gift30,
      paidBookings,
      bookingsByDay,
      revenueCommissionByDay,
      revenuePromoByDay,
      revenueGiftByDay,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.role, 'host')),
      db.select({ count: count() }).from(users).where(eq(users.role, 'guest')),
      db.select({ count: count() }).from(listings).where(eq(listings.status, 'moderation')),
      db.select({ count: count() }).from(listings).where(eq(listings.status, 'archived')),
      db.select({ count: count() }).from(listings).where(eq(listings.status, 'published')),
      db.select({ count: count() }).from(reviews).where(eq(reviews.status, 'pending')),
      db.select({ count: count() }).from(reports).where(inArray(reports.status, ['open', 'in_progress'])),
      db.select({ count: count() }).from(listingClaimRequests).where(eq(listingClaimRequests.status, 'pending')),
      db.select({ count: count() }).from(bookings),
      db.select({ count: count() }).from(bookings).where(gte(bookings.createdAt, since30)),
      sumBookingPlatformFee(),
      sumBookingPlatformFee(since30),
      sumPromoPurchases(),
      sumPromoPurchases(since30),
      sumGiftCertificateFees(),
      sumGiftCertificateFees(since30),
      countPaidBookings(),
      fetchBookingsByDay(chartSince),
      fetchCommissionByDay(chartSince),
      fetchPromoByDay(chartSince),
      fetchGiftCertificatesByDay(chartSince),
    ])

    const bookingCommission: AdminMoneyPeriod = {
      allTimeRub: bookingFeeAll,
      last30DaysRub: bookingFee30,
    }
    const promoPointsSales: AdminMoneyPeriod = {
      allTimeRub: promoAll,
      last30DaysRub: promo30,
    }
    const giftCertificates: AdminMoneyPeriod = {
      allTimeRub: giftAll,
      last30DaysRub: gift30,
    }
    const totalNet: AdminMoneyPeriod = {
      allTimeRub: bookingCommission.allTimeRub + promoPointsSales.allTimeRub + giftCertificates.allTimeRub,
      last30DaysRub: bookingCommission.last30DaysRub + promoPointsSales.last30DaysRub + giftCertificates.last30DaysRub,
    }

    return {
      queue: {
        users: usersRow[0]?.count ?? 0,
        listingsModeration: moderationRow[0]?.count ?? 0,
        listingsArchived: archivedRow[0]?.count ?? 0,
        reviewsPending: reviewsRow[0]?.count ?? 0,
        reportsOpen: reportsRow[0]?.count ?? 0,
        claimsPending: claimsRow[0]?.count ?? 0,
      },
      platform: {
        hosts: hostsRow[0]?.count ?? 0,
        guests: guestsRow[0]?.count ?? 0,
        listingsPublished: publishedRow[0]?.count ?? 0,
        bookingsTotal: bookingsTotalRow[0]?.count ?? 0,
        bookingsPaid: paidBookings,
        bookingsLast30Days: bookings30Row[0]?.count ?? 0,
      },
      revenue: {
        bookingCommission,
        promoPointsSales,
        giftCertificates,
        totalNet,
      },
      charts: {
        bookingsByDay,
        revenueCommissionByDay,
        revenuePromoByDay,
        revenueGiftCertificatesByDay: revenueGiftByDay,
      },
    }
  },
}
