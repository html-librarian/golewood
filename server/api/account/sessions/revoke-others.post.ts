import { refreshTokenSchema } from '#shared/schemas/auth'
import { sessionService } from '../../../services/session.service'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { refreshToken } = refreshTokenSchema.parse(body)
  const currentSessionId = await sessionService.resolveCurrentSessionId(user.id, refreshToken)

  if (!currentSessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Current session not found' })
  }

  return sessionService.revokeOthers(user.id, currentSessionId)
})
