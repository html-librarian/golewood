import { requireAuth } from '../../utils/auth'
import { favoriteService } from '../../services/favorite.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return favoriteService.list(user.id)
})
