import { adminHostPayoutDecisionSchema } from '#shared/schemas/host-payout'
import { requireRole } from '../../../utils/auth'
import { hostPayoutService } from '../../../services/host-payout.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const userId = getRouterParam(event, 'userId')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  const body = await readBody(event)
  const parsed = adminHostPayoutDecisionSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return hostPayoutService.decideByAdmin(userId, parsed.data)
})
