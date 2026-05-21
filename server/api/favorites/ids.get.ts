import { requireAuth } from '../../utils/auth'
import { favoriteService } from '../../services/favorite.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return { ids: await favoriteService.listIds(user.id) }
})
