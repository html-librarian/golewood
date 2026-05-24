import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'

export type DiscoveryDestinationsSortOptions = {
  /** City from confirmed geolocation (cookie source `geo`). */
  geoCity?: string | null
  /** City saved in user profile (`users.home_city`). */
  profileCity?: string | null
}

const normalize = (value: string) => value.trim().toLowerCase()

export const discoveryFilterMatchesCity = (filter: HomeDiscoveryFilter, city: string): boolean => {
  const target = normalize(city)

  if (!target) {
    return false
  }

  if (filter.params.city && normalize(filter.params.city) === target) {
    return true
  }

  if (normalize(filter.labelRu) === target) {
    return true
  }

  if (normalize(filter.labelEn) === target) {
    return true
  }

  return false
}

const findFilterIndex = (filters: HomeDiscoveryFilter[], city: string) =>
  filters.findIndex(filter => discoveryFilterMatchesCity(filter, city))

const priorityDestinationId = (city: string) => {
  const slug = normalize(city).replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')
  return `priority-${slug || 'city'}`
}

/** Card for a city that is not in the admin/home discovery list (profile or geo). */
export const createPriorityDestinationFilter = (city: string): HomeDiscoveryFilter => {
  const name = city.trim()

  return {
    id: priorityDestinationId(name),
    labelRu: name,
    labelEn: name,
    icon: 'ph:map-pin-duotone',
    tone: 'from-brand-500 to-teal-700',
    params: { city: name },
  }
}

/** Puts the user's city first: geo → profile → default order. Inserts a card if missing from the list. */
export const sortDiscoveryDestinations = (
  filters: HomeDiscoveryFilter[],
  options: DiscoveryDestinationsSortOptions,
): HomeDiscoveryFilter[] => {
  const priorityCity = options.geoCity?.trim()
    ? options.geoCity
    : options.profileCity?.trim() || null

  if (!priorityCity) {
    return filters
  }

  const index = findFilterIndex(filters, priorityCity)

  if (index === -1) {
    return [createPriorityDestinationFilter(priorityCity), ...filters]
  }

  if (index === 0) {
    return filters
  }

  const next = [...filters]
  const [match] = next.splice(index, 1)

  if (match) {
    next.unshift(match)
  }

  return next
}
