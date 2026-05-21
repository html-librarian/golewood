import { refreshTokenSchema } from '#shared/schemas/auth'
import { authService } from '../../services/auth.service'
import { getSessionClientMeta } from '../../utils/session-client-meta'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = refreshTokenSchema.parse(body)

  return authService.refresh(input, getSessionClientMeta(event))
})
