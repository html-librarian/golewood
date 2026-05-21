import { requireAuth } from '../../utils/auth'
import { bonusService } from '../../services/bonus.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  return bonusService.getAccountSummary(user.id)
})
