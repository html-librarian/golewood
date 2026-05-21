import { updateListingSchema } from '#shared/schemas/listing'
import { requireAuth } from '../../../utils/auth'
import { listingService } from '../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const body = await readBody(event)
  const input = updateListingSchema.parse(body)

  return listingService.update(id, user.id, input)
})
