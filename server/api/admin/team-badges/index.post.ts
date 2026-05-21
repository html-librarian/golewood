import { createTeamBadgeSchema } from '#shared/schemas/team-badge'
import { teamBadgeService } from '../../../services/team-badge.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = createTeamBadgeSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  setResponseStatus(event, 201)
  return teamBadgeService.create(parsed.data)
})
