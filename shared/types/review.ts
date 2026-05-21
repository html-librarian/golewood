import type { ReviewRatingBreakdown, ReviewRatings } from './review-ratings'

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ReviewStatus = typeof REVIEW_STATUSES[number]

export interface Review {
  id: string
  bookingId: string
  listingId: string
  authorId: string
  rating: number
  ratings: ReviewRatings
  text: string
  status: ReviewStatus
  createdAt: string
  updatedAt: string
}

export interface ReviewPhoto {
  id: string
  url: string
  sortOrder: number
}

export interface ReviewStayMeta {
  checkIn: string
  checkOut: string
  guests: number
  nights: number
}

export type ReviewReplyAuthorRole = 'host' | 'guest'

export interface ReviewReply {
  id: string
  reviewId: string
  parentReplyId: string | null
  authorId: string
  authorRole: ReviewReplyAuthorRole
  authorName: string | null
  text: string
  createdAt: string
  children: ReviewReply[]
}

export interface ReviewPublic {
  id: string
  rating: number
  ratings: ReviewRatings
  text: string
  authorName: string | null
  authorId: string
  createdAt: string
  photos: ReviewPhoto[]
  stay: ReviewStayMeta | null
  replies: ReviewReply[]
}

export interface ReviewHostItem extends ReviewPublic {
  status: ReviewStatus
}

export interface HostListingReviewsResponse {
  approved: ReviewPublic[]
  pending: ReviewHostItem[]
}

export const REVIEW_ELIGIBILITY_REASONS = ['no_booking', 'stay_in_progress', 'already_reviewed'] as const
export type ReviewEligibilityReason = typeof REVIEW_ELIGIBILITY_REASONS[number]

export interface ReviewEligibility {
  bookingId: string | null
  reason?: ReviewEligibilityReason
}

export interface ListingReviewsResponse {
  reviews: ReviewPublic[]
  averageRating: number | null
  ratingBreakdown: ReviewRatingBreakdown | null
  totalCount: number
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, { ru: string, en: string }> = {
  pending: { ru: 'На модерации', en: 'Pending moderation' },
  approved: { ru: 'Опубликован', en: 'Published' },
  rejected: { ru: 'Отклонён', en: 'Rejected' },
}
