import { createCalendarFeedSchema } from '#shared/schemas/calendar-sync'
import { requireAuth } from '../../../../../utils/auth'
import { calendarSyncService } from '../../../../../services/calendar-sync.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const body = await readBody(event)
  const input = createCalendarFeedSchema.parse(body)

  setResponseStatus(event, 201)
  return calendarSyncService.addFeed(listingId, user.id, input)
})
