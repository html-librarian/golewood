export interface ListingHostToolbarLabels {
  title: string
  edit: string
  calendar: string
  news: string
  manage: string
}

export interface ListingHostToolbarProps {
  listingId: string
  labels: ListingHostToolbarLabels
}
