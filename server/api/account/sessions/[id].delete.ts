import { sessionService } from '../../../services/session.service'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Session id is required' })
  }

  await sessionService.revoke(user.id, sessionId)

  return { ok: true }
})
