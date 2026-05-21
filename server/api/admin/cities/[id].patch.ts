import { updateCitySchema } from '#shared/schemas/catalog'
import { catalogService } from '../../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing city id' })
  }

  const body = await readBody(event)
  const parsed = updateCitySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return catalogService.updateCity(id, parsed.data)
})
