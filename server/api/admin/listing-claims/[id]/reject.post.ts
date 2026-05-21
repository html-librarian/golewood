import { requireRole } from '../../../../utils/auth'
import { listingClaimService } from '../../../../services/listing-claim.service'

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])

  const claimId = getRouterParam(event, 'id')

  if (!claimId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing claim id' })
  }

  return await listingClaimService.reject(claimId, admin.id)
})
