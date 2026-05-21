import { requireAuth } from '../../../../utils/auth'
import { calendarService } from '../../../../services/calendar.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  return calendarService.listBlocks(id, user.id)
})
