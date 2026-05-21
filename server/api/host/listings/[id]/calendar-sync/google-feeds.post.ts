import { createGoogleCalendarFeedSchema } from '#shared/schemas/calendar-sync'
import { calendarSyncService } from '../../../../../services/calendar-sync.service'
import { requireAuth } from '../../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  }

  const body = await readBody(event)
  const input = createGoogleCalendarFeedSchema.parse(body)
  const feed = await calendarSyncService.addGoogleFeed(listingId, user.id, input)

  return feed
})
