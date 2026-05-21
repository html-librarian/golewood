import { createListingSchema } from '#shared/schemas/listing'
import { requireAuth } from '../../../utils/auth'
import { listingService } from '../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const input = createListingSchema.parse(body)

  return listingService.create(user.id, input)
})
