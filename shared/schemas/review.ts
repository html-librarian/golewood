import { z } from 'zod'
import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from '../types/review-ratings'

const ratingDimensionSchema = z.number().int().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX)

export const reviewRatingsSchema = z.object({
  cleanliness: ratingDimensionSchema,
  checkIn: ratingDimensionSchema,
  location: ratingDimensionSchema,
  photoMatch: ratingDimensionSchema,
  value: ratingDimensionSchema,
  service: ratingDimensionSchema,
})

export const createReviewSchema = z.object({
  ratings: reviewRatingsSchema,
  text: z.string().trim().min(10).max(2000),
})

export const updateReviewStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
