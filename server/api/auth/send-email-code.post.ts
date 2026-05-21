import { sendEmailCodeSchema } from '#shared/schemas/auth'
import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = sendEmailCodeSchema.parse(body)

  return await authService.sendEmailCode(input)
})
