import { createAmenitySchema } from '#shared/schemas/catalog'
import { catalogService } from '../../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = createAmenitySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  setResponseStatus(event, 201)
  return catalogService.createAmenity(parsed.data)
})
