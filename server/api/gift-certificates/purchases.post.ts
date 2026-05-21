import { createGiftCertificatePurchaseSchema } from '#shared/schemas/gift-certificate'
import { requireAuth } from '../../utils/auth'
import { giftCertificateService } from '../../services/gift-certificate.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, createGiftCertificatePurchaseSchema.parse)
  return giftCertificateService.createPurchase(user.id, body)
})
