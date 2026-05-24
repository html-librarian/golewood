import { requireAuth } from '../../../utils/auth'
import { spotlightService } from '../../../services/spotlight.service'

const readField = (form: Awaited<ReturnType<typeof readMultipartFormData>>, name: string) =>
  form?.find(item => item.name === name)?.data?.toString('utf8').trim() ?? ''

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)
  const consentRaw = readField(form, 'consent')

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  setResponseStatus(event, 201)
  return spotlightService.upload(user.id, {
    listingId: readField(form, 'listingId') || undefined,
    listingUrl: readField(form, 'listingUrl') || undefined,
    placeName: readField(form, 'placeName') || undefined,
    externalSiteUrl: readField(form, 'externalSiteUrl') || undefined,
    externalInstagram: readField(form, 'externalInstagram') || undefined,
    caption: readField(form, 'caption') || undefined,
    consent: consentRaw === 'true' || consentRaw === '1' || consentRaw === 'on',
    file: {
      data: file.data,
      filename: file.filename,
      type: file.type,
    },
  })
})
