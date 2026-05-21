import { requireAuth } from '../../../../utils/auth'
import { listingService } from '../../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  return listingService.submitForModeration(id, user.id)
})
