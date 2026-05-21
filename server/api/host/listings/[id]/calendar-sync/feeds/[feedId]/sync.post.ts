import { requireAuth } from '../../../../../../../utils/auth'
import { calendarSyncService } from '../../../../../../../services/calendar-sync.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')
  const feedId = getRouterParam(event, 'feedId')

  if (!listingId || !feedId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing or feed id' })
  }

  return calendarSyncService.syncFeed(listingId, user.id, feedId)
})
