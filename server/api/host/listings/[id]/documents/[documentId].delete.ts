import { requireAuth } from '../../../../../utils/auth'
import { listingService } from '../../../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  const documentId = getRouterParam(event, 'documentId')

  if (!id || !documentId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing or document id' })
  }

  await listingService.removeDocument(id, user.id, documentId)
  return { ok: true }
})
