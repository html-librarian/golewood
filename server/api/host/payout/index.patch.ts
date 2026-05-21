import { upsertHostPayoutProfileSchema } from '#shared/schemas/host-payout'
import { requireAuth } from '../../../utils/auth'
import { hostPayoutService } from '../../../services/host-payout.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  if (user.role !== 'host' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readValidatedBody(event, upsertHostPayoutProfileSchema.parse)
  return hostPayoutService.submitForReview(user.id, body)
})
