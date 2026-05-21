import { z } from 'zod'
import { listingPropertyService } from '../../../services/listing-property.service'
import { listingService } from '../../../services/listing.service'

const querySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  guests: z.coerce.number().int().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })
  }

  const listing = await listingService.getPublishedById(id)

  if (listing.kind !== 'property') {
    throw createError({ statusCode: 400, statusMessage: 'Listing is not a property complex' })
  }

  const query = await getValidatedQuery(event, querySchema.parse)

  return listingPropertyService.getUnitOffers(id, query)
})
