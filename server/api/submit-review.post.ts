import { createReviewSchema } from '#shared/schemas/review'
import { z } from 'zod'
import { requireAuth } from '../utils/auth'
import { reviewService } from '../services/review.service'

const createReviewBodySchema = createReviewSchema.extend({
  bookingId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const parsed = createReviewBodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  const { bookingId, ...input } = parsed.data
  const review = await reviewService.create(bookingId, user.id, input)

  setResponseStatus(event, 201)

  return review
})
