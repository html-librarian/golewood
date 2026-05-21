import { verifyEmailCodeSchema } from '#shared/schemas/auth'
import { authService } from '../../services/auth.service'
import { getSessionClientMeta } from '../../utils/session-client-meta'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = verifyEmailCodeSchema.parse(body)

  return await authService.verifyEmailCode(input, getSessionClientMeta(event))
})
