import { requireAuth } from '../../../../../utils/auth'
import { listingService } from '../../../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  const photoId = getRouterParam(event, 'photoId')

  if (!id || !photoId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing or photo id' })
  }

  await listingService.removePhoto(id, user.id, photoId)
  return { ok: true }
})
