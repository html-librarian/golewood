import { requireAuth } from '../../../../../../../utils/auth'
import { listingNewsService } from '../../../../../../../services/listing-news.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')
  const newsId = getRouterParam(event, 'newsId')
  const mediaId = getRouterParam(event, 'mediaId')

  if (!listingId || !newsId || !mediaId) {
    throw createError({ statusCode: 400, statusMessage: 'Ids are required' })
  }

  await listingNewsService.removeMedia(mediaId, newsId, listingId, user)
  return { ok: true }
})
