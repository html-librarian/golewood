import type { BlogPostCard } from './blog'
import type { ListingPromotionMeta } from './promotion'
import type { TeamBadge } from './team-badge'

export const SEARCH_SORTS = ['price_asc', 'price_desc', 'distance'] as const
export type SearchSort = typeof SEARCH_SORTS[number]

export interface SearchParams {
  q?: string
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  /** Slug из accommodation_type_catalog */
  accommodationTypes?: string[]
  /** Slug меток team_badge_catalog (team_visited, team_approved, …) */
  teamBadgeSlugs?: string[]
  /** Только объекты каталога команды (без онлайн-брони) */
  teamCatalog?: boolean
  lat?: number
  lng?: number
  radius?: number
  sort?: SearchSort
  page?: number
  pageSize?: number
}

export interface SearchResultItem {
  id: string
  title: string
  city: string
  address: string
  pricePerNight: number
  maxGuests: number
  bedrooms: number
  amenities: string[]
  latitude: number
  longitude: number
  coverPhoto: { id: string, url: string, sortOrder: number } | null
  averageRating?: number | null
  reviewCount?: number
  distance?: number
  teamBadge?: TeamBadge | null
  teamBadgeBlogPost?: BlogPostCard | null
  hostNewsCount?: number
  latestHostNewsTitle?: string | null
  latestHostNewsExcerpt?: string | null
  teamReviewExcerptRu?: string | null
  teamReviewExcerptEn?: string | null
  promotions?: ListingPromotionMeta
  hostVerified?: boolean
  managedByTeam?: boolean
}

export interface SearchResult {
  items: SearchResultItem[]
  total: number
  page: number
  pageSize: number
}
