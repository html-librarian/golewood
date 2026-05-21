import { requireAuth } from '../../../../../../utils/auth'
import { listingNewsService } from '../../../../../../services/listing-news.service'
import { LISTING_NEWS_MEDIA_MAX_BYTES } from '#shared/utils/media-limits'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')
  const newsId = getRouterParam(event, 'newsId')

  if (!listingId || !newsId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id and news id are required' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)
  const embedField = form?.find(item => item.name === 'embedUrl')
  const embedUrl = embedField?.data?.toString('utf8')

  if (!file?.data && !embedUrl?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'File or video URL is required' })
  }

  if (file?.data && file.data.length > LISTING_NEWS_MEDIA_MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'File too large' })
  }

  return listingNewsService.addMedia(
    newsId,
    listingId,
    user,
    file?.data
      ? { data: file.data, filename: file.filename, type: file.type }
      : { data: Buffer.alloc(0) },
    embedUrl?.trim() || undefined,
  )
})
