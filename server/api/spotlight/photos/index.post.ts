import { requireAuth } from '../../../utils/auth'
import { spotlightService } from '../../../services/spotlight.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)
  const listingId = form?.find(item => item.name === 'listingId')?.data?.toString('utf8').trim()
  const caption = form?.find(item => item.name === 'caption')?.data?.toString('utf8')
  const consent = form?.find(item => item.name === 'consent')?.data?.toString('utf8')

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'listingId is required' })
  }

  setResponseStatus(event, 201)
  return spotlightService.upload(user.id, {
    listingId,
    caption,
    consent: consent === 'true' || consent === '1' || consent === 'on',
    file: {
      data: file.data,
      filename: file.filename,
      type: file.type,
    },
  })
})
