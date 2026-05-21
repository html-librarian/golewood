import { CITY_COORDINATES } from '../catalog/city-coordinates'
import { haversineKm } from './haversine'

const DEFAULT_MAX_RADIUS_KM = 75

export const resolveNearestCityName = (
  lat: number,
  lng: number,
  maxRadiusKm = DEFAULT_MAX_RADIUS_KM,
): string | null => {
  let best: { name: string, distance: number } | null = null

  for (const city of CITY_COORDINATES) {
    const distance = haversineKm(lat, lng, city.lat, city.lng)

    if (distance > maxRadiusKm) {
      continue
    }

    if (!best || distance < best.distance) {
      best = { name: city.name, distance }
    }
  }

  return best?.name ?? null
}
