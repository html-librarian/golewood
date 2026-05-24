import { updateHomeCitySchema } from '#shared/schemas/account-home-city'
import { accountProfileService } from '../../services/account-profile.service'

export default defineEventHandler(async (event) => {
  const authUser = requireAuth(event)
  const body = await readValidatedBody(event, updateHomeCitySchema.parse)
  return accountProfileService.updateHomeCity(authUser.id, body)
})
