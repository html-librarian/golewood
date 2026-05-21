import { requireAuth } from '../../../utils/auth'
import { maxService } from '../../../services/max.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  if (user.role !== 'host' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only hosts can link MAX notifications' })
  }

  return await maxService.createLinkCode(user.id)
})
