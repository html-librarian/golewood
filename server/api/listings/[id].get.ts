import { listingService } from '../../services/listing.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  return listingService.getPublishedById(id)
})
