import { createBlogPostSchema } from '#shared/schemas/blog'
import { blogService } from '../../../../services/blog.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = createBlogPostSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  setResponseStatus(event, 201)
  return blogService.create(parsed.data)
})
