import { describe, expect, it } from 'vitest'
import type { AdminDashboardStats } from '#shared/types/admin'

describe('AdminDashboardStats type', () => {
  it('matches expected shape', () => {
    const stats: AdminDashboardStats = {
      queue: {
        users: 3,
        listingsModeration: 1,
        listingsArchived: 0,
        reviewsPending: 1,
        reportsOpen: 1,
        claimsPending: 0,
      },
      platform: {
        hosts: 1,
        guests: 2,
        listingsPublished: 5,
        bookingsTotal: 10,
        bookingsPaid: 4,
        bookingsLast30Days: 2,
      },
      revenue: {
        bookingCommission: { allTimeRub: 1000, last30DaysRub: 200 },
        promoPointsSales: { allTimeRub: 500, last30DaysRub: 100 },
        giftCertificates: { allTimeRub: 300, last30DaysRub: 100 },
        totalNet: { allTimeRub: 1800, last30DaysRub: 400 },
      },
      charts: {
        bookingsByDay: [{ date: '2026-05-01', value: 1 }],
        revenueCommissionByDay: [{ date: '2026-05-01', value: 100 }],
        revenuePromoByDay: [{ date: '2026-05-01', value: 50 }],
        revenueGiftCertificatesByDay: [{ date: '2026-05-01', value: 30 }],
      },
    }

    expect(stats.revenue.totalNet.allTimeRub).toBe(1800)
    expect(stats.charts.bookingsByDay).toHaveLength(1)
  })
})
