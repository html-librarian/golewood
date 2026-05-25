import type { Listing } from '#shared/types/listing'

const MAX_SOURCE_ATTRIBUTION_LENGTH = 1000

export const normalizeSourceAttribution = (value: string | null | undefined) => {
  const trimmed = value?.trim()

  return trimmed ? trimmed.slice(0, MAX_SOURCE_ATTRIBUTION_LENGTH) : null
}

export const getListingSourceAttributionText = (
  listing: Pick<Listing, 'sourceAttributionRu' | 'sourceAttributionEn'>,
  locale: 'ru' | 'en',
) => {
  const primary = locale === 'en' ? listing.sourceAttributionEn : listing.sourceAttributionRu
  const fallback = locale === 'en' ? listing.sourceAttributionRu : listing.sourceAttributionEn

  return normalizeSourceAttribution(primary) ?? normalizeSourceAttribution(fallback)
}

export const listingRequiresSourceAttribution = (managedByTeam: boolean) => managedByTeam

export const teamListingSourceAttributionError = (
  managedByTeam: boolean,
  sourceAttributionRu: string | null | undefined,
) => {
  if (!listingRequiresSourceAttribution(managedByTeam)) {
    return null
  }

  if (!normalizeSourceAttribution(sourceAttributionRu)) {
    return 'Source attribution (RU) is required for team catalog listings'
  }

  return null
}
