import { requireAuth } from '../../../../utils/auth'
import { promotionService } from '../../../../services/promotion.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id required' })
  }

  return promotionService.listForHostListing(listingId, user.id)
})
