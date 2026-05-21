import { requireAuth } from '../../../utils/auth'
import { forbidInProduction } from '../../../utils/dev-guards'
import { maxService } from '../../../services/max.service'

export default defineEventHandler(async (event) => {
  forbidInProduction()

  const user = requireAuth(event)

  if (user.role !== 'host' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return await maxService.mockLink(user.id)
})
