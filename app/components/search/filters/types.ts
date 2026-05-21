import type { Amenity } from '#shared/types/listing'

export interface SearchFiltersProps {
  minPrice: string
  maxPrice: string
  amenities: Amenity[]
  accommodationTypes: string[]
  teamBadgeSlugs: string[]
}

export interface SearchFiltersEmits {
  'update:minPrice': [value: string]
  'update:maxPrice': [value: string]
  'update:amenities': [value: Amenity[]]
  'update:accommodationTypes': [value: string[]]
  'update:teamBadgeSlugs': [value: string[]]
}
