import { updateListingStatusSchema } from '#shared/schemas/listing'
import { requireRole } from '../../../../utils/auth'
import { listingService } from '../../../../services/listing.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const body = await readBody(event)
  const { status } = updateListingStatusSchema.parse(body)

  return listingService.updateStatus(id, status)
})
