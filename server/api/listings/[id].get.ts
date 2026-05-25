import { listingService } from '../../services/listing.service'
import { isMissingRelationError, schemaDriftHttpError } from '../../utils/db-errors'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  try {
    return await listingService.getPublishedById(id)
  } catch (error) {
    if (isMissingRelationError(error)) {
      schemaDriftHttpError(error)
    }

    throw error
  }
})
