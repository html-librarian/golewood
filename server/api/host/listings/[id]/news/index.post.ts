import { createListingNewsSchema } from '#shared/schemas/listing-news'
import { requireAuth } from '../../../../../utils/auth'
import { listingNewsService } from '../../../../../services/listing-news.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  }

  const body = await readBody(event)
  const parsed = createListingNewsSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  setResponseStatus(event, 201)
  return listingNewsService.create(listingId, user, parsed.data)
})
