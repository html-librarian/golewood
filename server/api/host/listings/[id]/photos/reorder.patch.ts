import { reorderListingMediaSchema } from '#shared/schemas/catalog'
import { requireAuth } from '../../../../../utils/auth'
import { listingService } from '../../../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const body = await readBody(event)
  const parsed = reorderListingMediaSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return listingService.reorderPhotos(id, user.id, parsed.data.photoIds)
})
