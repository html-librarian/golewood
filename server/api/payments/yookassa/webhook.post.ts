import { giftCertificateService } from '../../../services/gift-certificate.service'
import { hostPromoPurchaseService } from '../../../services/host-promo-purchase.service'
import { paymentService } from '../../../services/payment.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.event || !body?.object?.id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook payload' })
  }

  const payment = await paymentService.handleWebhook(body.event, body.object)
  const promoPurchase = await hostPromoPurchaseService.handleWebhook(body.event, body.object)
  const giftPurchase = await giftCertificateService.handleWebhook(body.event, body.object)

  return { ok: true, payment, promoPurchase, giftPurchase }
})
