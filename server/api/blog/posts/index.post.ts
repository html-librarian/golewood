import { userCreateBlogPostSchema } from '#shared/schemas/blog'
import { blogService } from '../../../services/blog.service'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const parsed = userCreateBlogPostSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  setResponseStatus(event, 201)
  return blogService.createForUser(user.id, parsed.data)
})
