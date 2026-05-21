import { requireAuth } from '../../../../../utils/auth'
import { listingNewsService } from '../../../../../services/listing-news.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  }

  return listingNewsService.listForHost(listingId, user)
})
