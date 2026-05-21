import { promotionService } from '../../services/promotion.service'
import { requireCronSecret } from '../../utils/cron-auth'

export default defineEventHandler(async (event) => {
  requireCronSecret(event)

  return await promotionService.syncMeiliPromotionFields()
})
