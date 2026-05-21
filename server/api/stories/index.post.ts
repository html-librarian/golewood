import { requireRole } from '../../utils/auth'
import { storyService } from '../../services/story.service'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['guest'])
  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)
  const listingId = form?.find(item => item.name === 'listingId')?.data?.toString('utf8').trim()

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'listingId is required' })
  }

  setResponseStatus(event, 201)
  return storyService.create(user.id, {
    listingId,
    file: {
      data: file.data,
      filename: file.filename,
      type: file.type,
    },
  })
})
