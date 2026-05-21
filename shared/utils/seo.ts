export const resolveSiteUrl = (value: string, siteUrl: string) => {
  const base = siteUrl.replace(/\/$/, '')

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `${base}${value.startsWith('/') ? value : `/${value}`}`
}

export const buildListingJsonLd = (listing: {
  id: string
  title: string
  description: string
  city: string
  pricePerNight: number
  coverPhotoUrl?: string | null
}, siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: listing.title,
  description: listing.description,
  url: `${siteUrl.replace(/\/$/, '')}/listings/${listing.id}`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: listing.city,
    addressCountry: 'RU',
  },
  priceRange: `RUB ${listing.pricePerNight}`,
  ...(listing.coverPhotoUrl ? { image: listing.coverPhotoUrl } : {}),
})
