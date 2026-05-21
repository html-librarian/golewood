import { createBlockSchema } from '#shared/schemas/booking'
import { requireAuth } from '../../../../utils/auth'
import { calendarService } from '../../../../services/calendar.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const body = await readBody(event)
  const input = createBlockSchema.parse(body)

  await calendarService.addBlock(id, user.id, input.startDate, input.endDate)

  return { ok: true }
})
