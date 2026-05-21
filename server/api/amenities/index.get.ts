import { FALLBACK_AMENITY_CATALOG } from '#shared/catalog/fallback-amenities'
import { catalogService } from '../../services/catalog.service'
import { isMissingRelationError } from '../../utils/db-errors'

export default defineEventHandler(async () => {
  try {
    return await catalogService.listAmenities(true)
  } catch (error) {
    if (isMissingRelationError(error)) {
      return FALLBACK_AMENITY_CATALOG
    }

    throw error
  }
})
