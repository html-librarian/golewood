import { updateReviewStatusSchema } from '#shared/schemas/review'
import { requireRole } from '../../../../utils/auth'
import { reviewService } from '../../../../services/review.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing review id' })
  }

  const body = await readBody(event)
  const { status } = updateReviewStatusSchema.parse(body)

  return reviewService.updateStatus(id, status)
})
