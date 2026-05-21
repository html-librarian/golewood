import type { SearchParams } from '../types/search'

export const buildMeiliFilters = (params: SearchParams) => {
  const filters: string[] = ['status = "published"']

  if (params.city) {
    filters.push(`city = "${params.city}"`)
  }

  if (params.minPrice !== undefined) {
    filters.push(`pricePerNight >= ${params.minPrice}`)
  }

  if (params.maxPrice !== undefined) {
    filters.push(`pricePerNight <= ${params.maxPrice}`)
  }

  if (params.guests !== undefined) {
    filters.push(`maxGuests >= ${params.guests}`)
  }

  for (const amenity of params.amenities ?? []) {
    filters.push(`amenities = "${amenity}"`)
  }

  for (const accommodationType of params.accommodationTypes ?? []) {
    filters.push(`accommodationTypes = "${accommodationType}"`)
  }

  if (params.teamCatalog) {
    filters.push('managedByTeam = true')
  }

  if (params.lat !== undefined && params.lng !== undefined && params.radius !== undefined) {
    filters.push(`_geoRadius(${params.lat}, ${params.lng}, ${params.radius * 1000})`)
  }

  return filters
}
