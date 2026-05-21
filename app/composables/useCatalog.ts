import type { CatalogCountryCode } from '#shared/catalog/countries'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { AmenityCatalogItem, City, Country } from '#shared/types/catalog'
import type { CreateAmenityInput, CreateCityInput, UpdateAmenityInput, UpdateCityInput } from '#shared/schemas/catalog'

export const useCatalog = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchCountries = () => $fetch<Country[]>('/api/countries')

  const fetchCities = (options?: { q?: string, country?: CatalogCountryCode }) => {
    const query: Record<string, string> = {}
    if (options?.q) {
      query.q = options.q
    }
    if (options?.country) {
      query.country = options.country
    }
    return $fetch<City[]>('/api/cities', { query: Object.keys(query).length ? query : undefined })
  }

  const fetchAmenities = async () => {
    try {
      return await $fetch<AmenityCatalogItem[]>('/api/amenities')
    } catch {
      const { FALLBACK_AMENITY_CATALOG } = await import('#shared/catalog/fallback-amenities')
      return FALLBACK_AMENITY_CATALOG
    }
  }

  const fetchAccommodationTypes = async () => {
    try {
      return await $fetch<import('#shared/types/catalog').AccommodationTypeCatalogItem[]>('/api/accommodation-types')
    } catch {
      const { FALLBACK_ACCOMMODATION_TYPES } = await import('#shared/catalog/accommodation-types-fallback')
      return FALLBACK_ACCOMMODATION_TYPES
    }
  }

  const fetchAdminCities = async (country?: CatalogCountryCode) => {
    await fetchMe()
    return $fetch<City[]>('/api/admin/cities', {
      headers: authHeaders(),
      query: country ? { country } : undefined,
    })
  }

  const createCity = async (input: CreateCityInput) =>
    $fetch<City>('/api/admin/cities', { method: 'POST', headers: authHeaders(), body: input })

  const updateCity = async (id: string, input: UpdateCityInput) =>
    $fetch<City>(`/api/admin/cities/${id}`, { method: 'PATCH', headers: authHeaders(), body: input })

  const fetchAdminAmenities = async () => {
    await fetchMe()
    return $fetch<AmenityCatalogItem[]>('/api/admin/amenities', { headers: authHeaders() })
  }

  const createAmenity = async (input: CreateAmenityInput) =>
    $fetch<AmenityCatalogItem>('/api/admin/amenities', { method: 'POST', headers: authHeaders(), body: input })

  const updateAmenity = async (id: string, input: UpdateAmenityInput) =>
    $fetch<AmenityCatalogItem>(`/api/admin/amenities/${id}`, { method: 'PATCH', headers: authHeaders(), body: input })

  return {
    fetchCountries,
    fetchCities,
    fetchAmenities,
    fetchAccommodationTypes,
    fetchAdminCities,
    createCity,
    updateCity,
    fetchAdminAmenities,
    createAmenity,
    updateAmenity,
  }
}
