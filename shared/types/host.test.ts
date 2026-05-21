import { describe, expect, it } from 'vitest'
import type { HostDashboardStats } from '#shared/types/host'

describe('HostDashboardStats type', () => {
  it('matches expected shape', () => {
    const stats: HostDashboardStats = {
      listingsPublished: 2,
      listingsDraft: 1,
      listingsModeration: 1,
      listingsArchived: 0,
      bookingsPending: 1,
      bookingsUpcoming: 3,
      analytics: {
        earningsLast30DaysRub: 50_000,
        paidBookingsLast30Days: 2,
        bookingsCreatedLast30Days: 4,
        averageRating: 4.8,
        approvedReviews: 5,
      },
      charts: {
        earningsByDay: [{ date: '2026-05-01', value: 10_000 }],
        bookingsByDay: [{ date: '2026-05-01', value: 1 }],
      },
    }

    expect(stats.analytics.earningsLast30DaysRub).toBeGreaterThan(0)
    expect(stats.charts.bookingsByDay).toHaveLength(1)
  })
})
