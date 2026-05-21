import { listingNewsReactionSchema } from '#shared/schemas/listing-news'
import { requireAuth } from '../../../../../utils/auth'
import { listingNewsService } from '../../../../../services/listing-news.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')
  const newsId = getRouterParam(event, 'newsId')

  if (!listingId || !newsId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id and news id are required' })
  }

  const body = await readBody(event)
  const parsed = listingNewsReactionSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  return listingNewsService.setReaction(listingId, newsId, user.id, parsed.data.reaction)
})
