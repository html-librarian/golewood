import { giftCertificateService } from '../../../../services/gift-certificate.service'

export default defineEventHandler(async (event) => {
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id required' })
  }

  return giftCertificateService.listOffersForListing(listingId, true)
})
