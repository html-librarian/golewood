import { blogService } from '../../../services/blog.service'
import { getAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const viewer = getAuthUser(event)
  return blogService.getPublishedBySlug(slug, viewer?.id)
})
