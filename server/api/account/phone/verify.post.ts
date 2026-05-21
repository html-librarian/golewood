import { changePhoneVerifySchema } from '#shared/schemas/auth'
import { requireAuth } from '../../../utils/auth'
import { accountPhoneService } from '../../../services/account-phone.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { phone, code } = changePhoneVerifySchema.parse(body)

  return await accountPhoneService.verifyChangeCode(user.id, phone, code)
})
