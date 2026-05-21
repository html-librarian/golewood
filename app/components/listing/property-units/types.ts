import type { ListingUnitCard } from '#shared/types/listing'

export interface ListingPropertyUnitsLabels {
  title: string
  empty: string
  pricePerNight: string
  guests: string
  bedrooms: string
  choose: string
  book: string
  unavailable: string
  loadingOffers: string
  forNights: string
}

export interface ListingPropertyUnitsProps {
  propertyId: string
  units: ListingUnitCard[]
  checkIn?: string
  checkOut?: string
  guests?: number
  labels: ListingPropertyUnitsLabels
}
