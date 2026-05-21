import { mfaVerifySchema } from '#shared/schemas/auth'
import { authService } from '../../services/auth.service'
import { getSessionClientMeta } from '../../utils/session-client-meta'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { challengeToken, code } = mfaVerifySchema.parse(body)

  return await authService.verifyMfa(challengeToken, code, getSessionClientMeta(event))
})
