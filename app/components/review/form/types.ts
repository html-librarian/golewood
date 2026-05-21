import type { ReviewRatings } from '#shared/types/review-ratings'

export interface ReviewFormProps {
  loading?: boolean
}

export interface ReviewFormEmits {
  submitReview: [payload: { ratings: ReviewRatings, text: string, photos: File[] }]
}
