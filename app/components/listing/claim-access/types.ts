export interface ListingClaimAccessProps {
  listingId: string
}

export interface ListingClaimAccessLabels {
  title: string
  subtitle: string
  teamBadge: string
  name: string
  phone: string
  email: string
  message: string
  attachments: string
  attachmentsHint: string
  submit: string
  success: string
  error: string
}

export interface ListingClaimAccessPropsWithLabels extends ListingClaimAccessProps {
  labels: ListingClaimAccessLabels
}
