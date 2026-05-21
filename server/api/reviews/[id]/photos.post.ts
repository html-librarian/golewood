import { requireAuth } from '../../../utils/auth'
import { reviewService } from '../../../services/review.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing review id' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  setResponseStatus(event, 201)
  return reviewService.addPhoto(id, user.id, {
    data: file.data,
    filename: file.filename,
    type: file.type,
  })
})
