import { createListingClaimSchema } from '#shared/schemas/listing-claim'
import { listingClaimService } from '../../../services/listing-claim.service'

const readFormField = (form: Awaited<ReturnType<typeof readMultipartFormData>>, name: string) => {
  const part = form?.find(item => item.name === name && item.data)
  return part?.data?.toString('utf8').trim() ?? ''
}

export default defineEventHandler(async (event) => {
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const form = await readMultipartFormData(event)
  const input = createListingClaimSchema.parse({
    name: readFormField(form, 'name'),
    phone: readFormField(form, 'phone'),
    email: readFormField(form, 'email') || undefined,
    message: readFormField(form, 'message') || undefined,
  })

  const fileParts = form?.filter(item => item.name === 'files' && item.data && item.filename) ?? []

  return await listingClaimService.create(listingId, {
    ...input,
    email: input.email || undefined,
  }, fileParts.map(part => ({
    data: part.data!,
    filename: part.filename,
    type: part.type,
  })))
})
