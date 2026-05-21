import { giftCertificateRedeemPreviewSchema } from '#shared/schemas/gift-certificate'
import { giftCertificateService } from '../../../../services/gift-certificate.service'

export default defineEventHandler(async (event) => {
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const body = await readValidatedBody(event, giftCertificateRedeemPreviewSchema.parse)
  const redemption = await giftCertificateService.resolveRedemption(body.code, listingId)

  return { creditRub: redemption.creditRub }
})
