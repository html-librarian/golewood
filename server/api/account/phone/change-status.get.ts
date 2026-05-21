import { requireAuth } from '../../../utils/auth'
import { accountPhoneService } from '../../../services/account-phone.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return await accountPhoneService.getChangeStatus(user.id)
})
