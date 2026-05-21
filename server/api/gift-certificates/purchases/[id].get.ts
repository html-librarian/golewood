import { requireAuth } from '../../../utils/auth'
import { giftCertificateService } from '../../../services/gift-certificate.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const purchaseId = getRouterParam(event, 'id')

  if (!purchaseId) {
    throw createError({ statusCode: 400, statusMessage: 'Purchase id required' })
  }

  const sync = getQuery(event).return === '1'

  if (sync) {
    await giftCertificateService.getPurchaseForBuyer(purchaseId, user.id, true)
  }

  return giftCertificateService.getPurchasePublic(purchaseId, user.id)
})
