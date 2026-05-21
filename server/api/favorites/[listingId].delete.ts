import { requireAuth } from '../../utils/auth'
import { favoriteService } from '../../services/favorite.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'listingId')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  return favoriteService.remove(user.id, listingId)
})
