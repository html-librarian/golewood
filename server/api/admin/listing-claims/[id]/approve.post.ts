import { approveListingClaimSchema } from '#shared/schemas/listing-claim'
import { requireRole } from '../../../../utils/auth'
import { listingClaimService } from '../../../../services/listing-claim.service'

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])
  const claimId = getRouterParam(event, 'id')

  if (!claimId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing claim id' })
  }

  const body = await readBody(event)
  const input = approveListingClaimSchema.parse(body)

  return await listingClaimService.approve(claimId, admin.id, {
    hostUserId: input.hostUserId,
    assignRequesterAsHost: input.assignRequesterAsHost,
  })
})
