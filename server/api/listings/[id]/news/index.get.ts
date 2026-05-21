import { getAuthUser } from '../../../../utils/auth'
import { listingNewsService } from '../../../../services/listing-news.service'

export default defineEventHandler((event) => {
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  }

  const userId = getAuthUser(event)?.id

  return listingNewsService.listPublishedForListing(listingId, userId)
})
