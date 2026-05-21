import { createReviewReplySchema } from '#shared/schemas/review-reply'
import { requireAuth } from '../../../utils/auth'
import { reviewService } from '../../../services/review.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const reviewId = getRouterParam(event, 'id')

  if (!reviewId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing review id' })
  }

  const body = await readBody(event)
  const input = createReviewReplySchema.parse(body)

  return await reviewService.createReply(reviewId, user.id, input)
})
