import { requireAuth } from '../../../../../../utils/auth'
import { listingNewsService } from '../../../../../../services/listing-news.service'
import { saveListingNewsMedia } from '../../../../../../utils/storage'
import { LISTING_NEWS_PREVIEW_MAX_BYTES } from '#shared/utils/media-limits'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')
  const newsId = getRouterParam(event, 'newsId')

  if (!listingId || !newsId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id and news id are required' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  if (file.data.length > LISTING_NEWS_PREVIEW_MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'File too large' })
  }

  const url = await saveListingNewsMedia(newsId, {
    data: file.data,
    filename: file.filename,
    type: file.type,
  }, 'photo')

  return listingNewsService.setPreviewImage(newsId, listingId, user, url)
})
