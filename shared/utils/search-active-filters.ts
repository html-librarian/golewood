import { formatPrice } from './format'

export type SearchActiveFilterTagKind = 'price' | 'amenity' | 'accommodationType' | 'teamBadge'

export type SearchActiveFilterTag = {
  key: string
  kind: SearchActiveFilterTagKind
  slug?: string
  label: string
}

type LabeledSlug = { slug: string, labelRu: string, labelEn: string }

export type BuildSearchActiveFilterTagsInput = {
  minPrice: string
  maxPrice: string
  amenities: string[]
  accommodationTypes: string[]
  teamBadgeSlugs: string[]
  amenityCatalog: LabeledSlug[]
  accommodationCatalog: LabeledSlug[]
  teamBadgeCatalog: LabeledSlug[]
  locale: string
  priceFromLabel: (price: string) => string
  priceToLabel: (price: string) => string
  priceRangeLabel: (min: string, max: string) => string
}

const labelFor = (item: LabeledSlug, locale: string) =>
  locale === 'en' ? item.labelEn : item.labelRu

const findLabel = (catalog: LabeledSlug[], slug: string, locale: string) => {
  const item = catalog.find(entry => entry.slug === slug)

  return item ? labelFor(item, locale) : slug
}

export const buildSearchActiveFilterTags = (input: BuildSearchActiveFilterTagsInput): SearchActiveFilterTag[] => {
  const tags: SearchActiveFilterTag[] = []
  const min = input.minPrice ? Number(input.minPrice) : undefined
  const max = input.maxPrice ? Number(input.maxPrice) : undefined
  const priceLocale = input.locale === 'en' ? 'en-US' : 'ru-RU'

  if (min !== undefined && !Number.isNaN(min) || max !== undefined && !Number.isNaN(max)) {
    let label: string

    if (min !== undefined && !Number.isNaN(min) && max !== undefined && !Number.isNaN(max)) {
      label = input.priceRangeLabel(formatPrice(min, priceLocale), formatPrice(max, priceLocale))
    } else if (min !== undefined && !Number.isNaN(min)) {
      label = input.priceFromLabel(formatPrice(min, priceLocale))
    } else {
      label = input.priceToLabel(formatPrice(max!, priceLocale))
    }

    tags.push({ key: 'price', kind: 'price', label })
  }

  for (const slug of input.teamBadgeSlugs) {
    tags.push({
      key: `teamBadge:${slug}`,
      kind: 'teamBadge',
      slug,
      label: findLabel(input.teamBadgeCatalog, slug, input.locale),
    })
  }

  for (const slug of input.accommodationTypes) {
    tags.push({
      key: `accommodationType:${slug}`,
      kind: 'accommodationType',
      slug,
      label: findLabel(input.accommodationCatalog, slug, input.locale),
    })
  }

  for (const slug of input.amenities) {
    tags.push({
      key: `amenity:${slug}`,
      kind: 'amenity',
      slug,
      label: findLabel(input.amenityCatalog, slug, input.locale),
    })
  }

  return tags
}
