import { updateSpotlightPhotoStatusSchema } from '#shared/schemas/spotlight'
import { spotlightService } from '../../../../services/spotlight.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const body = await readBody(event)
  const parsed = updateSpotlightPhotoStatusSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return spotlightService.updateStatus(id, parsed.data.status)
})
