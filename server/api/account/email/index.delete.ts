import { requireAuth } from '../../../utils/auth'
import { accountEmailService } from '../../../services/account-email.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return await accountEmailService.unlink(user.id)
})
