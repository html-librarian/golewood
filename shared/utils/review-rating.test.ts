import { describe, expect, it } from 'vitest'
import { averageReviewRatings, computeOverallRating, formatReviewScore, getReviewRatingLabel, getReviewScoreTone } from './review-rating'

describe('review-rating utils', () => {
  const ratings = {
    cleanliness: 9,
    checkIn: 10,
    location: 8,
    photoMatch: 9,
    value: 8,
    service: 9,
  }

  it('computes overall from dimensions', () => {
    expect(computeOverallRating(ratings)).toBe(8.8)
  })

  it('averages multiple reviews', () => {
    const breakdown = averageReviewRatings([ratings, { ...ratings, cleanliness: 7 }])
    expect(breakdown?.overall).toBeGreaterThan(8)
    expect(breakdown?.cleanliness).toBe(8)
  })

  it('formats score for ru locale', () => {
    expect(formatReviewScore(9, 'ru-RU')).toBe('9,0')
  })

  it('returns rating label', () => {
    expect(getReviewRatingLabel(9.2, 'ru')).toBe('Превосходно')
    expect(getReviewRatingLabel(10, 'en')).toBe('Exceptional')
    expect(getReviewScoreTone(9.8)).toBe('exceptional')
    expect(getReviewScoreTone(7.5)).toBe('good')
  })
})
