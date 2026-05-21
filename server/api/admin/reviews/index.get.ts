import { requireRole } from '../../../utils/auth'
import { reviewService } from '../../../services/review.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  return reviewService.listPending()
})
