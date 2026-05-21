import { requireAuth } from '../../../../../utils/auth'
import { listingPropertyService } from '../../../../../services/listing-property.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing property id' })
  }

  await listingPropertyService.assertProperty(id, user.id)

  return listingPropertyService.listUnitsForProperty(id, { hostId: user.id })
})
