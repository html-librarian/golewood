import { blogPostSearchQuerySchema } from '#shared/schemas/blog'
import { blogService } from '../../../services/blog.service'
import { getAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const query = blogPostSearchQuerySchema.parse(getQuery(event))
  const viewer = getAuthUser(event)

  const result = await blogService.searchPublished({
    authorId: query.authorId,
    listingId: query.listingId,
    city: query.city,
    q: query.q,
    authorQ: query.authorQ,
    followingUserId: query.following && viewer ? viewer.id : undefined,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  })

  return result
})
