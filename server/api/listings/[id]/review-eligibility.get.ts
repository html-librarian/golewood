import { requireAuth } from '../../../utils/auth'
import { reviewService } from '../../../services/review.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const preferredBookingId = getQuery(event).bookingId as string | undefined

  return reviewService.getEligibility(id, user.id, preferredBookingId)
})
