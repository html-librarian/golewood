import { maxBridgeAuthSchema } from '#shared/schemas/max-bridge'
import { getAuthUser } from '../../../utils/auth'
import { maxBridgeService } from '../../../services/max-bridge.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { initData } = maxBridgeAuthSchema.parse(body)
  const currentUser = getAuthUser(event)

  if (currentUser) {
    return await maxBridgeService.linkForCurrentUser(event, initData)
  }

  return await maxBridgeService.authenticate(initData)
})
