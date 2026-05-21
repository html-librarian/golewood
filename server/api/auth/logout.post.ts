import { refreshTokenSchema } from '#shared/schemas/auth'
import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = refreshTokenSchema.parse(body)

  await authService.logout(input)

  return { ok: true }
})
