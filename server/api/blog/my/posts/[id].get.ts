import { blogService } from '../../../../services/blog.service'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  return blogService.getByIdForAuthor(id, user.id)
})
