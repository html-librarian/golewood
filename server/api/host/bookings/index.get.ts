import { requireAuth } from '../../../utils/auth'
import { bookingService } from '../../../services/booking.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return bookingService.listForHost(user.id)
})
