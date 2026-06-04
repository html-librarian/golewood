import { blogService } from '../../../services/blog.service'
import { getAuthUser } from '../../../utils/auth'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const limit = query.limit ? Number(query.limit) : 8
  const viewer = getAuthUser(event)

  return blogService.listPopularAuthors(
    Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 8,
    viewer?.id,
  )
})
