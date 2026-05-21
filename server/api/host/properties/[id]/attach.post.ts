import { attachListingsToPropertySchema } from '#shared/schemas/property'
import { requireAuth } from '../../../../utils/auth'
import { listingPropertyService } from '../../../../services/listing-property.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const hostId = user.id
  const propertyId = getRouterParam(event, 'id')

  if (!propertyId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing property id' })
  }

  const body = await readValidatedBody(event, attachListingsToPropertySchema.parse)

  return listingPropertyService.attachListings(propertyId, hostId, body.listingIds)
})
