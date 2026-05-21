import { updateTeamBadgeSchema } from '#shared/schemas/team-badge'
import { teamBadgeService } from '../../../services/team-badge.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const body = await readBody(event)
  const parsed = updateTeamBadgeSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return teamBadgeService.update(id, parsed.data)
})
