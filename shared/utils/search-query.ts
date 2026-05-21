import type { SearchParams, SearchSort } from '../types/search'
import { SEARCH_SORTS } from '../types/search'

const pickQuery = (value: unknown): string => {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim()
  }

  return String(value ?? '').trim()
}

const parseNumber = (value: unknown): number | undefined => {
  const raw = pickQuery(value)

  if (!raw) {
    return undefined
  }

  const parsed = Number(raw)

  return Number.isFinite(parsed) ? parsed : undefined
}

export const parseSearchParamsFromRoute = (query: Record<string, unknown>): SearchParams => {
  const amenitiesRaw = query.amenities
  const amenities = Array.isArray(amenitiesRaw)
    ? amenitiesRaw.map(item => String(item).trim()).filter(Boolean)
    : pickQuery(amenitiesRaw)
      ? pickQuery(amenitiesRaw).split(',').map(item => item.trim()).filter(Boolean)
      : undefined

  const sortRaw = pickQuery(query.sort)
  const sort = SEARCH_SORTS.includes(sortRaw as SearchSort) ? sortRaw as SearchSort : undefined

  const accommodationTypesRaw = query.accommodationTypes
  const accommodationTypes = Array.isArray(accommodationTypesRaw)
    ? accommodationTypesRaw.map(item => String(item).trim()).filter(Boolean)
    : pickQuery(accommodationTypesRaw)
      ? pickQuery(accommodationTypesRaw).split(',').map(item => item.trim()).filter(Boolean)
      : undefined

  const teamBadgeSlugsRaw = query.teamBadgeSlugs
  const teamBadgeSlugs = Array.isArray(teamBadgeSlugsRaw)
    ? teamBadgeSlugsRaw.map(item => String(item).trim()).filter(Boolean)
    : pickQuery(teamBadgeSlugsRaw)
      ? pickQuery(teamBadgeSlugsRaw).split(',').map(item => item.trim()).filter(Boolean)
      : undefined

  const page = parseNumber(query.page)
  const pageSize = parseNumber(query.pageSize)
  const teamCatalogRaw = pickQuery(query.teamCatalog)

  return {
    city: pickQuery(query.city) || undefined,
    checkIn: pickQuery(query.checkIn) || undefined,
    checkOut: pickQuery(query.checkOut) || undefined,
    guests: parseNumber(query.guests),
    minPrice: parseNumber(query.minPrice),
    maxPrice: parseNumber(query.maxPrice),
    sort,
    amenities: amenities?.length ? amenities : undefined,
    accommodationTypes: accommodationTypes?.length ? accommodationTypes : undefined,
    teamBadgeSlugs: teamBadgeSlugs?.length ? teamBadgeSlugs : undefined,
    teamCatalog: teamCatalogRaw === '1' || teamCatalogRaw === 'true' ? true : undefined,
    page,
    pageSize,
  }
}

export const buildSearchRouteQuery = (params: SearchParams): Record<string, string> => {
  const entries: Array<[string, string]> = []

  if (params.city) {
    entries.push(['city', params.city])
  }

  if (params.checkIn) {
    entries.push(['checkIn', params.checkIn])
  }

  if (params.checkOut) {
    entries.push(['checkOut', params.checkOut])
  }

  if (params.guests !== undefined) {
    entries.push(['guests', String(params.guests)])
  }

  if (params.minPrice !== undefined) {
    entries.push(['minPrice', String(params.minPrice)])
  }

  if (params.maxPrice !== undefined) {
    entries.push(['maxPrice', String(params.maxPrice)])
  }

  if (params.sort) {
    entries.push(['sort', params.sort])
  }

  if (params.amenities?.length) {
    entries.push(['amenities', params.amenities.join(',')])
  }

  if (params.accommodationTypes?.length) {
    entries.push(['accommodationTypes', params.accommodationTypes.join(',')])
  }

  if (params.teamBadgeSlugs?.length) {
    entries.push(['teamBadgeSlugs', params.teamBadgeSlugs.join(',')])
  }

  if (params.teamCatalog) {
    entries.push(['teamCatalog', '1'])
  }

  if (params.page !== undefined && params.page > 1) {
    entries.push(['page', String(params.page)])
  }

  if (params.pageSize !== undefined && params.pageSize !== 12) {
    entries.push(['pageSize', String(params.pageSize)])
  }

  return Object.fromEntries(entries)
}

export const searchParamsCacheKey = (params: SearchParams): string =>
  JSON.stringify({
    city: params.city ?? '',
    checkIn: params.checkIn ?? '',
    checkOut: params.checkOut ?? '',
    guests: params.guests ?? '',
    minPrice: params.minPrice ?? '',
    maxPrice: params.maxPrice ?? '',
    sort: params.sort ?? '',
    amenities: [...(params.amenities ?? [])].sort(),
    accommodationTypes: [...(params.accommodationTypes ?? [])].sort(),
    teamBadgeSlugs: [...(params.teamBadgeSlugs ?? [])].sort(),
    teamCatalog: params.teamCatalog ? '1' : '',
    page: params.page ?? '',
    pageSize: params.pageSize ?? '',
  })

/** Filters only — for debounced apply without conflicting with pagination in the URL. */
export const searchFilterCacheKey = (params: SearchParams): string =>
  searchParamsCacheKey({ ...params, page: undefined, pageSize: undefined })

export const normalizeSearchPage = (page?: number) =>
  page !== undefined && page > 1 ? page : undefined
