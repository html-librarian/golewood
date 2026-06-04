import { blogAuthorSearchQuerySchema } from '#shared/schemas/blog'
import { blogService } from '../../../services/blog.service'
import { getAuthUser } from '../../../utils/auth'

export default defineEventHandler((event) => {
  const query = blogAuthorSearchQuerySchema.parse(getQuery(event))
  const viewer = getAuthUser(event)
  return blogService.searchAuthors(query.q, query.limit, viewer?.id)
})
