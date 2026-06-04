import { blogService } from '../../../../services/blog.service'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  return blogService.listMyPosts(user.id)
})
