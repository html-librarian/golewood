import type { BlogPostCard } from './blog'
import type { HostVerificationPublic } from './host-verification'
import type { ListingPromotionMeta } from './promotion'
import type { TeamBadge } from './team-badge'

export const LISTING_STATUSES = ['draft', 'moderation', 'published', 'archived'] as const
export type ListingStatus = typeof LISTING_STATUSES[number]

/** standalone — одно жильё; property — комплекс (глэмпинг); unit — домик внутри комплекса */
export const LISTING_KINDS = ['standalone', 'property', 'unit'] as const
export type ListingKind = typeof LISTING_KINDS[number]

export const CANCELLATION_POLICIES = ['flexible', 'moderate', 'strict'] as const
export type CancellationPolicy = typeof CANCELLATION_POLICIES[number]

export type ListingMediaType = 'photo' | 'video'

export interface ListingPhoto {
  id: string
  url: string
  sortOrder: number
  mediaType: ListingMediaType
  embedUrl?: string | null
  provider?: string | null
}

export interface ListingDocument {
  id: string
  title: string
  fileUrl: string
  fileName: string
  sortOrder: number
}

export interface ListingUnitCard {
  id: string
  title: string
  status: ListingStatus
  pricePerNight: number
  maxGuests: number
  bedrooms: number
  coverPhoto: ListingPhoto | null
}

export interface Listing {
  id: string
  hostId: string
  kind: ListingKind
  propertyListingId: string | null
  /** Для property: число опубликованных домиков */
  unitCount?: number
  /** Для property в выдаче: минимальная цена среди домиков */
  priceFrom?: number | null
  title: string
  description: string
  status: ListingStatus
  pricePerNight: number
  city: string
  address: string
  latitude: number
  longitude: number
  maxGuests: number
  extraGuestsOffered: boolean
  maxGuestsWithExtra: number | null
  extraGuestPricePerNight: number | null
  bedrooms: number
  amenities: Amenity[]
  /** Slug from accommodation_type_catalog (standalone / unit) */
  accommodationType?: string | null
  houseRules: string
  /** Local time HH:mm */
  checkInTime: string
  /** Local time HH:mm */
  checkOutTime: string
  minNights: number
  cancellationPolicy: CancellationPolicy
  cleaningFee: number
  transferOffered: boolean
  transferPrice: number | null
  transferPriceOnRequest: boolean
  managedByTeam: boolean
  teamBadge?: TeamBadge | null
  teamBadgeBlogPost?: BlogPostCard | null
  hostNewsCount?: number
  latestHostNewsTitle?: string | null
  latestHostNewsExcerpt?: string | null
  latestHostNewsAt?: string | null
  latestHostNewsPreviewUrl?: string | null
  teamReviewExcerptRu?: string | null
  teamReviewExcerptEn?: string | null
  hostVerification?: HostVerificationPublic | null
  promotions?: ListingPromotionMeta
  hostVerified?: boolean
  createdAt: string
  updatedAt: string
}

export interface ListingCard extends Listing {
  coverPhoto: ListingPhoto | null
  averageRating?: number | null
  reviewCount?: number
}

export interface ListingDetail extends Listing {
  photos: ListingPhoto[]
  documents: ListingDocument[]
  /** Опубликованные домики комплекса (только для kind=property) */
  units?: ListingUnitCard[]
}

export const AMENITIES = [
  'wifi',
  'parking',
  'kitchen',
  'washer',
  'tv',
  'air_conditioning',
  'pets_allowed',
  'children_allowed',
] as const

/** @deprecated Prefer slug strings validated against amenity_catalog */
export type Amenity = typeof AMENITIES[number] | string

export const AMENITY_LABELS: Record<Amenity, { ru: string, en: string }> = {
  wifi: { ru: 'Wi‑Fi', en: 'Wi‑Fi' },
  parking: { ru: 'Парковка', en: 'Parking' },
  kitchen: { ru: 'Кухня', en: 'Kitchen' },
  washer: { ru: 'Стиральная машина', en: 'Washer' },
  tv: { ru: 'Телевизор', en: 'TV' },
  air_conditioning: { ru: 'Кондиционер', en: 'Air conditioning' },
  pets_allowed: { ru: 'Можно с животными', en: 'Pets allowed' },
  children_allowed: { ru: 'Подходит для детей', en: 'Children allowed' },
}

export const LISTING_STATUS_LABELS: Record<ListingStatus, { ru: string, en: string }> = {
  draft: { ru: 'Черновик', en: 'Draft' },
  moderation: { ru: 'На модерации', en: 'Moderation' },
  published: { ru: 'Опубликовано', en: 'Published' },
  archived: { ru: 'В архиве', en: 'Archived' },
}

export const CANCELLATION_POLICY_LABELS: Record<CancellationPolicy, { ru: string, en: string }> = {
  flexible: {
    ru: 'Гибкая: полный возврат за 24 часа до заезда',
    en: 'Flexible: full refund until 24 hours before check-in',
  },
  moderate: {
    ru: 'Умеренная: полный возврат за 5 дней до заезда',
    en: 'Moderate: full refund until 5 days before check-in',
  },
  strict: {
    ru: 'Строгая: возврат 50% за 7 дней до заезда',
    en: 'Strict: 50% refund until 7 days before check-in',
  },
}
