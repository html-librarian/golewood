import { googleCalendarService } from '../../../services/google-calendar.service'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getQuery(event).listingId

  if (!listingId || typeof listingId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'listingId is required' })
  }

  if (!googleCalendarService.isConfigured()) {
    await googleCalendarService.mockConnect(user.id)
    return sendRedirect(event, `/host/listings/${listingId}/calendar?google=connected`)
  }

  const url = await googleCalendarService.getConnectUrl(user.id, listingId)
  return sendRedirect(event, url)
})
