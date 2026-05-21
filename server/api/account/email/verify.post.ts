import { verifyEmailCodeSchema } from '#shared/schemas/auth'
import { requireAuth } from '../../../utils/auth'
import { accountEmailService } from '../../../services/account-email.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { email, code } = verifyEmailCodeSchema.parse(body)

  return await accountEmailService.verifyLinkCode(user.id, email, code)
})
