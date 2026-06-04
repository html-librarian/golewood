import { updateBlogPostSchema } from '#shared/schemas/blog'
import { blogService } from '../../../../services/blog.service'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const body = await readBody(event)
  const parsed = updateBlogPostSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  return blogService.update(id, parsed.data, { authorId: user.id })
})
