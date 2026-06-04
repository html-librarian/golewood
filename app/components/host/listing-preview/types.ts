export interface HostListingPreviewProps {
  caption: string
  hint: string
  placeholderTitle: string
  placeholderCity: string
  title: string
  city: string
  maxGuests: number
  bedrooms: number
  coverPhotoUrl: string | null
  /** Guest-facing price per night incl. service fee; omit to hide price line. */
  guestPricePerNight?: number | null
}
