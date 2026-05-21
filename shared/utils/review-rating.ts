import type { ReviewRatingBreakdown, ReviewRatingDimension, ReviewRatings } from '../types/review-ratings'
import { REVIEW_RATING_DIMENSIONS, REVIEW_RATING_MAX } from '../types/review-ratings'

export const roundReviewScore = (value: number) => Math.round(value * 10) / 10

export const computeOverallRating = (ratings: ReviewRatings) => {
  const sum = REVIEW_RATING_DIMENSIONS.reduce((total, key) => total + ratings[key], 0)
  return roundReviewScore(sum / REVIEW_RATING_DIMENSIONS.length)
}

export const averageReviewRatings = (items: ReviewRatings[]): ReviewRatingBreakdown | null => {
  if (!items.length) {
    return null
  }

  const breakdown = {} as ReviewRatingBreakdown

  for (const key of REVIEW_RATING_DIMENSIONS) {
    const sum = items.reduce((total, item) => total + item[key], 0)
    breakdown[key] = roundReviewScore(sum / items.length)
  }

  breakdown.overall = roundReviewScore(
    REVIEW_RATING_DIMENSIONS.reduce((total, key) => total + breakdown[key], 0) / REVIEW_RATING_DIMENSIONS.length,
  )

  return breakdown
}

export const formatReviewScore = (score: number, locale: string) => {
  const formatted = roundReviewScore(score).toFixed(1)
  return locale.startsWith('ru') ? formatted.replace('.', ',') : formatted
}

type ReviewRatingLabel = { ru: string, en: string }

const REVIEW_RATING_LABELS: { min: number, label: ReviewRatingLabel }[] = [
  { min: 9.5, label: { ru: 'Великолепно', en: 'Exceptional' } },
  { min: 9, label: { ru: 'Превосходно', en: 'Superb' } },
  { min: 8, label: { ru: 'Хорошо', en: 'Good' } },
  { min: 7, label: { ru: 'Неплохо', en: 'Pleasant' } },
  { min: 6, label: { ru: 'Нормально', en: 'Fair' } },
  { min: 0, label: { ru: 'Слабо', en: 'Poor' } },
]

export const getReviewRatingLabel = (score: number, locale: string) => {
  const normalized = roundReviewScore(score)
  const entry = REVIEW_RATING_LABELS.find(item => normalized >= item.min)
  const label = entry?.label ?? REVIEW_RATING_LABELS[REVIEW_RATING_LABELS.length - 1]!.label
  return locale.startsWith('ru') ? label.ru : label.en
}

export const reviewRatingBarPercent = (score: number) =>
  Math.min(100, Math.max(0, (roundReviewScore(score) / REVIEW_RATING_MAX) * 100))

export type ReviewScoreTone = 'exceptional' | 'great' | 'good' | 'fair'

export const getReviewScoreTone = (score: number): ReviewScoreTone => {
  const normalized = roundReviewScore(score)

  if (normalized >= 9.5) {
    return 'exceptional'
  }

  if (normalized >= 8.5) {
    return 'great'
  }

  if (normalized >= 7) {
    return 'good'
  }

  return 'fair'
}

export const isReviewRatingDimension = (value: string): value is ReviewRatingDimension =>
  (REVIEW_RATING_DIMENSIONS as readonly string[]).includes(value)
