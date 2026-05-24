export type SearchActiveFilterTagKind = 'price' | 'amenity' | 'accommodationType' | 'teamBadge'

export type SearchActiveFilterTag = {
  key: string
  kind: SearchActiveFilterTagKind
  slug?: string
  label: string
}

export interface SearchActiveFiltersProps {
  minPrice: string
  maxPrice: string
  amenities: string[]
  accommodationTypes: string[]
  teamBadgeSlugs: string[]
}

export interface SearchActiveFiltersEmits {
  remove: [tag: SearchActiveFilterTag]
}
