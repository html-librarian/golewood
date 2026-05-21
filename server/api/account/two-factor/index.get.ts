import { requireAuth } from '../../../utils/auth'
import { twoFactorService } from '../../../services/two-factor.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return await twoFactorService.getStatus(user.id)
})
