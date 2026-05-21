import { requireAuth } from '../../../../../utils/auth'
import { giftCertificateService } from '../../../../../services/gift-certificate.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id required' })
  }

  if (user.role !== 'host' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return {
    nominals: giftCertificateService.listNominals(),
    offers: await giftCertificateService.listOffersForListing(listingId),
  }
})
