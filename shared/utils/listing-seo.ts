import { formatPrice } from '#shared/utils/format'
import { resolveSiteUrl } from '#shared/utils/seo'

const META_TITLE_MAX = 70
const META_DESCRIPTION_MAX = 320
const DESCRIPTION_EXCERPT_MAX = 160

export type ListingSeoSource = {
  id: string
  title: string
  description: string
  city: string
  pricePerNight: number
  maxGuests: number
  metaTitle?: string | null
  metaDescription?: string | null
  coverPhotoUrl?: string | null
}

export type ListingSeoLocale = 'ru' | 'en'

export const truncateForMeta = (value: string, max: number) => {
  const trimmed = value.trim().replace(/\s+/g, ' ')

  if (trimmed.length <= max) {
    return trimmed
  }

  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

export const buildListingMetaTitle = (
  listing: Pick<ListingSeoSource, 'title' | 'city' | 'metaTitle'>,
  _locale: ListingSeoLocale = 'ru',
) => {
  const custom = listing.metaTitle?.trim()

  if (custom) {
    return truncateForMeta(custom, META_TITLE_MAX)
  }

  return truncateForMeta(`${listing.title} — ${listing.city}`, META_TITLE_MAX)
}

export const buildListingMetaDescription = (
  listing: Pick<ListingSeoSource, 'description' | 'city' | 'pricePerNight' | 'maxGuests' | 'metaDescription'>,
  locale: ListingSeoLocale = 'ru',
) => {
  const custom = listing.metaDescription?.trim()

  if (custom) {
    return truncateForMeta(custom, META_DESCRIPTION_MAX)
  }

  const excerpt = truncateForMeta(listing.description, DESCRIPTION_EXCERPT_MAX)

  if (excerpt) {
    return truncateForMeta(
      locale === 'en'
        ? `${excerpt} · From ${formatPrice(listing.pricePerNight)}/night in ${listing.city}.`
        : `${excerpt} · От ${formatPrice(listing.pricePerNight)}/ночь, ${listing.city}.`,
      META_DESCRIPTION_MAX,
    )
  }

  return locale === 'en'
    ? `Vacation rental in ${listing.city}. From ${formatPrice(listing.pricePerNight)}/night, up to ${listing.maxGuests} guests. Book on Golewood.`
    : `Аренда в ${listing.city}. От ${formatPrice(listing.pricePerNight)} за ночь, до ${listing.maxGuests} гостей. Бронирование на Golewood.`
}

export const pickListingOgImage = (
  coverPhotoUrl: string | null | undefined,
  siteUrl: string,
  defaultOgImagePath: string,
) => {
  if (coverPhotoUrl?.trim()) {
    return resolveSiteUrl(coverPhotoUrl, siteUrl)
  }

  return resolveSiteUrl(defaultOgImagePath, siteUrl)
}

export const buildListingSeoPayload = (
  listing: ListingSeoSource,
  options: {
    siteUrl: string
    siteName: string
    locale: ListingSeoLocale
    path: string
    defaultOgImagePath: string
  },
) => {
  const locale = options.locale === 'en' ? 'en' : 'ru'
  const title = buildListingMetaTitle(listing, locale)
  const description = buildListingMetaDescription(listing, locale)
  const image = pickListingOgImage(listing.coverPhotoUrl, options.siteUrl, options.defaultOgImagePath)
  const canonical = resolveSiteUrl(options.path, options.siteUrl)

  return {
    title,
    description,
    path: options.path,
    image,
    canonical,
    ogType: 'website' as const,
    siteName: options.siteName,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      name: listing.title,
      description: listing.description || description,
      url: resolveSiteUrl(`/listings/${listing.id}`, options.siteUrl),
      address: {
        '@type': 'PostalAddress',
        addressLocality: listing.city,
        addressCountry: 'RU',
      },
      priceRange: `RUB ${listing.pricePerNight}`,
      image,
    },
  }
}
