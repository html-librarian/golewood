import { listingService } from '../../services/listing.service'
import { isMissingRelationError } from '../../utils/db-errors'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  try {
    return await listingService.listPublished(typeof query.city === 'string' ? query.city : undefined)
  } catch (error) {
    if (isMissingRelationError(error)) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Database schema outdated. Run: npm run db:migrate',
      })
    }

    throw error
  }
})
