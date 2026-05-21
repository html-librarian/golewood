import type { AmenityCategory } from '#shared/catalog/amenity-categories'
import type { CatalogCountryCode } from '#shared/catalog/countries'

export interface Country {
  id: string
  code: CatalogCountryCode
  nameRu: string
  nameEn: string
  active: boolean
  sortOrder: number
}

export interface City {
  id: string
  countryId: string
  countryCode: CatalogCountryCode
  name: string
  nameEn: string | null
  active: boolean
  sortOrder: number
}

export interface AmenityCatalogItem {
  id: string
  slug: string
  icon: string
  labelRu: string
  labelEn: string
  category: AmenityCategory
  active: boolean
  sortOrder: number
}

export interface AccommodationTypeCatalogItem {
  slug: string
  icon: string
  labelRu: string
  labelEn: string
  active: boolean
  sortOrder: number
}
