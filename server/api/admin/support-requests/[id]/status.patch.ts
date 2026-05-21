import { updateSupportRequestStatusSchema } from '#shared/schemas/admin'
import { supportRequestService } from '../../../../services/support-request.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing support request id' })
  }

  const body = await readBody(event)
  const { status, staffNote } = updateSupportRequestStatusSchema.parse(body)

  return supportRequestService.updateStatus(id, status, staffNote)
})
