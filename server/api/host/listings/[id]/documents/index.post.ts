import { requireAuth } from '../../../../../utils/auth'
import { listingService } from '../../../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)
  const titleField = form?.find(item => item.name === 'title')
  const title = titleField?.data?.toString('utf8').trim() || file?.filename || 'Document'

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  setResponseStatus(event, 201)
  return listingService.addDocument(id, user.id, { title }, {
    data: file.data,
    filename: file.filename,
    type: file.type,
  })
})
