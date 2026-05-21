import { sendCodeSchema } from '#shared/schemas/auth'
import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = sendCodeSchema.parse(body)

  return authService.sendCode(input)
})
