import { calendarQuerySchema } from '#shared/schemas/booking'
import { calendarService } from '../../../services/calendar.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const query = calendarQuerySchema.parse(getQuery(event))

  return calendarService.getAvailability(id, query.from, query.to)
})
