import { blogService } from '../../../../services/blog.service'
import { getAuthUser } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const authorId = getRouterParam(event, 'id')

  if (!authorId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const viewer = getAuthUser(event)
  const [author, posts] = await Promise.all([
    blogService.getAuthorProfile(authorId, viewer?.id),
    blogService.listByAuthor(authorId, false, viewer?.id),
  ])

  return { author, posts }
})
