import { calendarService } from '../../../../services/calendar.service'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const host = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  }

  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : ''
  const to = typeof query.to === 'string' ? query.to : ''

  if (!from || !to) {
    throw createError({ statusCode: 400, statusMessage: 'from and to are required' })
  }

  return calendarService.getHostAvailability(listingId, host.id, from, to)
})
