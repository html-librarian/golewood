import { twoFactorCodeSchema } from '#shared/schemas/auth'
import { requireAuth } from '../../../utils/auth'
import { twoFactorService } from '../../../services/two-factor.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { code } = twoFactorCodeSchema.parse(body)

  return await twoFactorService.confirmEnable(user.id, code)
})
