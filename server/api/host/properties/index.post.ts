import { createPropertyListingSchema } from '#shared/schemas/listing'
import { requireAuth } from '../../../utils/auth'
import { listingPropertyService } from '../../../services/listing-property.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const input = createPropertyListingSchema.parse(body)

  return listingPropertyService.createProperty(user.id, input)
})
