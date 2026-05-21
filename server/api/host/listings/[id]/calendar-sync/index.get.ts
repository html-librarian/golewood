import { requireAuth } from '../../../../../utils/auth'
import { calendarSyncService } from '../../../../../services/calendar-sync.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  return calendarSyncService.getSyncState(listingId, user.id)
})
