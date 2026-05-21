import { requireAuth } from '../../../../../utils/auth'
import { calendarService } from '../../../../../services/calendar.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')
  const blockId = getRouterParam(event, 'blockId')

  if (!listingId || !blockId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  await calendarService.removeBlock(listingId, blockId, user.id)

  return { ok: true }
})
