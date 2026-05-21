import { requireAuth } from '../../utils/auth'
import { bookingService } from '../../services/booking.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing booking id' })
  }

  return bookingService.getForGuest(id, user.id)
})
