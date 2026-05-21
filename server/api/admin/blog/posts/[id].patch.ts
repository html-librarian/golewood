import { updateBlogPostSchema } from '#shared/schemas/blog'
import { blogService } from '../../../../services/blog.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Post id is required' })
  }

  const body = await readBody(event)
  const parsed = updateBlogPostSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  return blogService.update(id, parsed.data)
})
