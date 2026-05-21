import { requireRole } from '../../../utils/auth'
import { hostPayoutService } from '../../../services/host-payout.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  return hostPayoutService.listPendingForAdmin()
})
