import { spotlightVoteSchema } from '#shared/schemas/spotlight'
import { requireAuth } from '../../../utils/auth'
import { spotlightService } from '../../../services/spotlight.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const parsed = spotlightVoteSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return spotlightService.vote(user.id, parsed.data)
})
