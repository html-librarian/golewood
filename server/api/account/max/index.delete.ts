import { requireAuth } from '../../../utils/auth'
import { maxService } from '../../../services/max.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  await maxService.unlink(user.id)

  return { ok: true }
})
