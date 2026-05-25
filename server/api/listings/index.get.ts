import { listingService } from '../../services/listing.service'
import { isMissingRelationError, schemaDriftHttpError } from '../../utils/db-errors'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  try {
    return await listingService.listPublished(typeof query.city === 'string' ? query.city : undefined)
  } catch (error) {
    if (isMissingRelationError(error)) {
      schemaDriftHttpError(error)
    }

    throw error
  }
})
