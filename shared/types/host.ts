import type { ChartSeriesPoint } from './chart'
import type { ListingCard } from './listing'
import type { ListingNewsItem } from './listing-news'
import type { HostVerificationPublic } from './host-verification'

export interface HostStats {
  listingsPublished: number
  listingsDraft: number
  listingsModeration: number
  listingsArchived: number
  bookingsPending: number
  bookingsUpcoming: number
}

/** Сводка пользы портала за последние 30 дней. */
export interface HostAnalyticsSummary {
  earningsLast30DaysRub: number
  paidBookingsLast30Days: number
  bookingsCreatedLast30Days: number
  averageRating: number | null
  approvedReviews: number
}

export interface HostDashboardCharts {
  earningsByDay: ChartSeriesPoint[]
  bookingsByDay: ChartSeriesPoint[]
}

export interface HostDashboardStats extends HostStats {
  analytics: HostAnalyticsSummary
  charts: HostDashboardCharts
}

export interface HostProfileNewsItem extends ListingNewsItem {
  listingId: string
  listingTitle: string
}

export interface HostPublicProfile {
  id: string
  name: string | null
  profileDescription: string | null
  memberSince: string
  listingsCount: number
  averageRating: number | null
  reviewCount: number
  verification: HostVerificationPublic
  listings: ListingCard[]
  news: HostProfileNewsItem[]
}
