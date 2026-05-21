import { z } from 'zod'
import { phoneSchema } from '#shared/schemas/auth'
import { requireRole } from '../../../utils/auth'
import { adminUserService } from '../../../services/admin-user.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const query = getQuery(event)
  const { phone } = z.object({ phone: phoneSchema }).parse(query)

  const user = await adminUserService.findByPhone(phone)

  return { user }
})
