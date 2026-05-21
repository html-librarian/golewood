import { requireRole } from '../../../utils/auth'
import { listingClaimService } from '../../../services/listing-claim.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  return await listingClaimService.listPending()
})
