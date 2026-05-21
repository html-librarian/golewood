import { updateAmenitySchema } from '#shared/schemas/catalog'
import { catalogService } from '../../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing amenity id' })
  }

  const body = await readBody(event)
  const parsed = updateAmenitySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return catalogService.updateAmenity(id, parsed.data)
})
