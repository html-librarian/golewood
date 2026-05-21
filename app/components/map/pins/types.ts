import type { ListingCard } from '#shared/types/listing'

export interface MapPinItem {
  id: string
  latitude: number
  longitude: number
  listing: ListingCard
}

export interface MapPinsProps {
  items: MapPinItem[]
  activeId?: string | null
  class?: string
}

export interface MapPinsEmits {
  select: [id: string]
}
