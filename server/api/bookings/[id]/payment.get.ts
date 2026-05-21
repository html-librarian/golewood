import { requireAuth } from '../../../utils/auth'
import { paymentService } from '../../../services/payment.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing booking id' })
  }

  const query = getQuery(event)

  if (query.return === '1') {
    return paymentService.syncFromReturn(id, user.id)
  }

  return paymentService.getForBooking(id, user.id)
})
