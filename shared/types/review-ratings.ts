export const REVIEW_RATING_MIN = 1
export const REVIEW_RATING_MAX = 10

export const REVIEW_RATING_DIMENSIONS = [
  'cleanliness',
  'checkIn',
  'location',
  'photoMatch',
  'value',
  'service',
] as const

export type ReviewRatingDimension = typeof REVIEW_RATING_DIMENSIONS[number]

export interface ReviewRatings {
  cleanliness: number
  checkIn: number
  location: number
  photoMatch: number
  value: number
  service: number
}

export interface ReviewRatingBreakdown extends ReviewRatings {
  overall: number
}
