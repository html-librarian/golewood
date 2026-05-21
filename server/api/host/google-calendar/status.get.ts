import { googleCalendarService } from '../../../services/google-calendar.service'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  return googleCalendarService.getConnectionStatus(user.id)
})
