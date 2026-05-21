import { purchaseHostPromoPointsSchema } from '#shared/schemas/host-promo-purchase'
import { requireAuth } from '../../../utils/auth'
import { hostPromoPurchaseService } from '../../../services/host-promo-purchase.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, purchaseHostPromoPointsSchema.parse)
  return hostPromoPurchaseService.create(user.id, body)
})
