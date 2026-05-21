import { upsertHostVerificationSchema } from '#shared/schemas/host-verification'
import { requireRole } from '../../../../utils/auth'
import { hostVerificationService } from '../../../../services/host-verification.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  const body = await readBody(event)
  const parsed = upsertHostVerificationSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return hostVerificationService.upsertByAdmin(userId, parsed.data)
})
