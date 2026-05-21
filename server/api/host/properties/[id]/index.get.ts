import { requireAuth } from '../../../../utils/auth'
import { listingPropertyService } from '../../../../services/listing-property.service'
import { listingService } from '../../../../services/listing.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing property id' })
  }

  await listingPropertyService.assertProperty(id, user.id)

  const [detail, units] = await Promise.all([
    listingService.getByIdForHost(id, user.id),
    listingPropertyService.listUnitsForProperty(id, { hostId: user.id }),
  ])

  return { ...detail, units }
})
