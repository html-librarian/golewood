import { maxBridgeMockSchema } from '#shared/schemas/max-bridge'
import { maxBridgeService } from '../../../services/max-bridge.service'
import { forbidInProduction } from '../../../utils/dev-guards'

export default defineEventHandler(async (event) => {
  forbidInProduction()

  const body = await readBody(event)
  const { maxUserId } = maxBridgeMockSchema.parse(body)

  return await maxBridgeService.mockAuthenticate(maxUserId)
})
