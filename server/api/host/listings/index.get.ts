import { requireAuth } from '../../../utils/auth'
import { listingService } from '../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return listingService.listByHost(user.id)
})
