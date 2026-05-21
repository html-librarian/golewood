import { requireAuth } from '../../utils/auth'
import { hostService } from '../../services/host.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return await hostService.getDashboardStats(user.id)
})
