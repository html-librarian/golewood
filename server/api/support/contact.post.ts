import { supportContactSchema } from '#shared/schemas/support'
import { supportService } from '../../services/support.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = supportContactSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return supportService.sendContactMessage(parsed.data)
})
