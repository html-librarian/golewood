import { getAuthUser } from '../../../utils/auth'
import { spotlightService } from '../../../services/spotlight.service'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const monthKey = typeof query.month === 'string' ? query.month : undefined
  const user = getAuthUser(event)

  return spotlightService.getVoteState(user?.id, monthKey)
})
