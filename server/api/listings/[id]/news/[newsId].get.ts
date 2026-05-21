import { getAuthUser } from '../../../../utils/auth'
import { listingNewsService } from '../../../../services/listing-news.service'

export default defineEventHandler((event) => {
  const listingId = getRouterParam(event, 'id')
  const newsId = getRouterParam(event, 'newsId')

  if (!listingId || !newsId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id and news id are required' })
  }

  const userId = getAuthUser(event)?.id

  return listingNewsService.getPublishedById(listingId, newsId, userId)
})
