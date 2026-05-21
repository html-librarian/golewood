import { geoCityQuerySchema } from '#shared/schemas/geo'
import { geoService } from '../../services/geo.service'

export default defineEventHandler(async (event) => {
  const query = geoCityQuerySchema.parse(getQuery(event))

  return geoService.resolveCity(query.lat, query.lng)
})
