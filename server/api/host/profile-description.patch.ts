import { updateHostProfileDescriptionSchema } from '#shared/schemas/host-profile'
import { requireAuth } from '../../utils/auth'
import { hostService } from '../../services/host.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  if (user.role !== 'host' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const parsed = updateHostProfileDescriptionSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return hostService.updateProfileDescription(user.id, parsed.data)
})
