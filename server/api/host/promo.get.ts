import { requireAuth } from '../../utils/auth'
import { hostPromoService } from '../../services/host-promo.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  return hostPromoService.getAccountSummary(user.id)
})
