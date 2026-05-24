import { moveHomeDiscoveryItemSchema } from '#shared/schemas/home-discovery'
import { homeDiscoveryService } from '../../../../../services/home-discovery.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing item id' })
  }

  const body = await readBody(event)
  const parsed = moveHomeDiscoveryItemSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return homeDiscoveryService.moveItem(id, parsed.data.direction)
})
