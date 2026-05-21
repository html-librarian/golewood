import { requireAuth } from '../../../../utils/auth'
import { hostPromoPurchaseService } from '../../../../services/host-promo-purchase.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const purchaseId = getRouterParam(event, 'id')

  if (!purchaseId) {
    throw createError({ statusCode: 400, statusMessage: 'Purchase id required' })
  }

  const sync = getQuery(event).return === '1'

  return hostPromoPurchaseService.getForUser(purchaseId, user.id, sync)
})
