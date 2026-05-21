import { requireAuth } from '../../../../../utils/auth'
import { listingNewsService } from '../../../../../services/listing-news.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')
  const newsId = getRouterParam(event, 'newsId')

  if (!listingId || !newsId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing and news ids are required' })
  }

  await listingNewsService.delete(newsId, listingId, user)
  setResponseStatus(event, 204)
})
