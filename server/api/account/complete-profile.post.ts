import { completeProfileSchema } from '#shared/schemas/account-profile'
import { accountProfileService } from '../../services/account-profile.service'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = requireAuth(event)
  const body = await readValidatedBody(event, completeProfileSchema.parse)
  return accountProfileService.completeProfile(authUser.id, body)
})
