import { requireAuth } from '../../../../utils/auth'
import { reviewService } from '../../../../services/review.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  if (user.role !== 'host' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return await reviewService.listForHostListing(listingId, user.id)
})
