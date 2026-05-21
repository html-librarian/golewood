import { requireAuth } from '../../../utils/auth'
import { hostPayoutService } from '../../../services/host-payout.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  return hostPayoutService.getForUser(user.id)
})
