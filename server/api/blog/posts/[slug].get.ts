import { blogService } from '../../../services/blog.service'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  return blogService.getPublishedBySlug(slug)
})
