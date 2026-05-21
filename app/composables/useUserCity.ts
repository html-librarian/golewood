import type { ResolvedGeoCity } from '#shared/types/geo'

const PREFERRED_CITY_COOKIE = 'preferred-city'
const PREFERRED_CITY_SOURCE_COOKIE = 'preferred-city-source'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export type PreferredCitySource = 'geo' | 'manual'

export const useUserCity = () => {
  const city = useCookie<string | null>(PREFERRED_CITY_COOKIE, {
    default: () => null,
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const source = useCookie<PreferredCitySource | null>(PREFERRED_CITY_SOURCE_COOKIE, {
    default: () => null,
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const detecting = useState('user-city-detecting', () => false)
  const geoAttempted = useState('user-city-geo-attempted', () => false)

  const isGeoDefault = computed(() => Boolean(city.value) && source.value === 'geo')

  const setCity = (name: string, citySource: PreferredCitySource = 'manual') => {
    const trimmed = name.trim()

    if (!trimmed) {
      clearCity()
      return
    }

    city.value = trimmed
    source.value = citySource
  }

  const clearCity = () => {
    city.value = null
    source.value = null
  }

  const detectCity = async () => {
    if (!import.meta.client || geoAttempted.value || city.value) {
      return
    }

    if (!navigator.geolocation) {
      geoAttempted.value = true
      return
    }

    geoAttempted.value = true
    detecting.value = true

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 12_000,
          maximumAge: 300_000,
        })
      })

      const result = await $fetch<ResolvedGeoCity>('/api/geo/city', {
        query: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      })

      if (result.city) {
        city.value = result.city
        source.value = 'geo'
      }
    } catch {
      // Permission denied, timeout, or no matching city in catalog
    } finally {
      detecting.value = false
    }
  }

  return {
    city,
    source,
    isGeoDefault,
    detecting,
    setCity,
    clearCity,
    detectCity,
  }
}
