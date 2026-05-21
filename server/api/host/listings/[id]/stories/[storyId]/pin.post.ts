import { requireRole } from '../../../../../../utils/auth'
import { storyService } from '../../../../../../services/story.service'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['host', 'admin'])
  const listingId = getRouterParam(event, 'id')
  const storyId = getRouterParam(event, 'storyId')

  if (!listingId || !storyId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing and story ids are required' })
  }

  return storyService.pin(listingId, user, storyId)
})
