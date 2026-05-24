import { createHomeDiscoveryItemSchema } from '#shared/schemas/home-discovery'
import { homeDiscoveryService } from '../../../../services/home-discovery.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = createHomeDiscoveryItemSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  setResponseStatus(event, 201)
  return homeDiscoveryService.createItem(parsed.data)
})
