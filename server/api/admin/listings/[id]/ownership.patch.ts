import { updateListingOwnershipSchema } from '#shared/schemas/listing-claim'
import { requireRole } from '../../../../utils/auth'
import { listingClaimService } from '../../../../services/listing-claim.service'
import { mapListing } from '../../../../utils/listing-map'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const body = await readBody(event)
  const input = updateListingOwnershipSchema.parse(body)
  const row = await listingClaimService.updateListingOwnership(listingId, input)

  return mapListing(row)
})
