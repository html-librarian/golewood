import type { ReviewRatingBreakdown } from '#shared/types/review-ratings'

export interface ReviewRatingSummaryProps {
  breakdown: ReviewRatingBreakdown
  totalCount: number
}
