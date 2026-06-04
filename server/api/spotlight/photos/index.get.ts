import { getAuthUser } from '../../../utils/auth'
import { spotlightService } from '../../../services/spotlight.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const monthKey = typeof query.month === 'string' ? query.month : undefined
  const user = getAuthUser(event)

  const [photos, myPending] = await Promise.all([
    spotlightService.listApproved(monthKey, user?.id),
    user?.id
      ? spotlightService.listMyPendingForMonth(user.id, monthKey)
      : Promise.resolve([]),
  ])

  return { photos, myPending }
})
