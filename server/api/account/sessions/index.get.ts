import { sessionService } from '../../../services/session.service'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)
  const refreshToken = typeof query.refreshToken === 'string' ? query.refreshToken : undefined
  const currentSessionId = await sessionService.resolveCurrentSessionId(user.id, refreshToken)

  return {
    sessions: await sessionService.listForUser(user.id, currentSessionId),
  }
})
