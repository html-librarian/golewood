import { requireRole } from '../../../../utils/auth'
import { storyService } from '../../../../services/story.service'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['host', 'admin'])
  const storyId = getRouterParam(event, 'storyId')

  if (!storyId) {
    throw createError({ statusCode: 400, statusMessage: 'Story id is required' })
  }

  return storyService.repostToProfile(user, storyId)
})
