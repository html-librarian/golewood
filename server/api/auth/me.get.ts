import { requireAuth } from '../../utils/auth'
import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return authService.getMe(user.id)
})
