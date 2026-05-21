import { requireRole } from '../../../../utils/auth'
import { hostVerificationService } from '../../../../services/host-verification.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  return hostVerificationService.getAdminForUser(userId)
})
