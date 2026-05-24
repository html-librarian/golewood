export interface ListingOverviewStripAmenity {
  slug: string
  label: string
  icon: string
}

export interface ListingOverviewStripProps {
  reviewScore: number | null
  reviewLabel: string | null
  reviewCount: number
  amenities: ListingOverviewStripAmenity[]
  city: string
  address?: string | null
  hasMap: boolean
}

export interface ListingOverviewStripEmits {
  scrollToReviews: []
  scrollToAmenities: []
  scrollToMap: []
}
