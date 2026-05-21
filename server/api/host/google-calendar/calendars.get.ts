import { googleCalendarService } from '../../../services/google-calendar.service'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const calendars = await googleCalendarService.listCalendars(user.id)

  return { calendars }
})
