import { blogService } from '../../../../services/blog.service'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const follower = requireAuth(event)
  const authorId = getRouterParam(event, 'id')

  if (!authorId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  return blogService.unfollowAuthor(follower.id, authorId)
})
