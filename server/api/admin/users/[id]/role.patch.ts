import { updateUserRoleSchema } from '#shared/schemas/admin'
import { adminUserService } from '../../../../services/admin-user.service'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  const body = await readBody(event)
  const { role } = updateUserRoleSchema.parse(body)

  return adminUserService.updateRole(id, role, actor.id, actor.role)
})
