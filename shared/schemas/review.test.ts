import { describe, expect, it } from 'vitest'
import { createReviewSchema } from './review'

const validRatings = {
  cleanliness: 9,
  checkIn: 10,
  location: 8,
  photoMatch: 9,
  value: 8,
  service: 9,
}

describe('createReviewSchema', () => {
  it('accepts valid review', () => {
    const result = createReviewSchema.parse({
      ratings: validRatings,
      text: 'Great stay, highly recommend!',
    })

    expect(result.ratings.cleanliness).toBe(9)
  })

  it('rejects short text', () => {
    expect(() => createReviewSchema.parse({ ratings: validRatings, text: 'Short' })).toThrow()
  })

  it('rejects invalid dimension score', () => {
    expect(() => createReviewSchema.parse({
      ratings: { ...validRatings, cleanliness: 11 },
      text: 'Great stay, highly recommend!',
    })).toThrow()
  })
})
