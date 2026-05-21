import { requireRole } from '../../../../../utils/auth'
import { storyService } from '../../../../../services/story.service'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['host', 'admin'])
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  }

  return storyService.listForHost(listingId, user)
})
