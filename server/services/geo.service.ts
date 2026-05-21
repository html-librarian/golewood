import type { ResolvedGeoCity } from '#shared/types/geo'
import { resolveNearestCityName } from '#shared/utils/geo-city'
import { catalogService } from './catalog.service'

export const geoService = {
  resolveCity: async (lat: number, lng: number): Promise<ResolvedGeoCity> => {
    const nearest = resolveNearestCityName(lat, lng)

    if (!nearest) {
      return { city: null, cityEn: null }
    }

    try {
      const row = await catalogService.assertCityName(nearest)

      return {
        city: row.name,
        cityEn: row.nameEn,
      }
    } catch {
      return { city: null, cityEn: null }
    }
  },
}
