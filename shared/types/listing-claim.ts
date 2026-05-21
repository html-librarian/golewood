export const LISTING_CLAIM_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ListingClaimStatus = typeof LISTING_CLAIM_STATUSES[number]

export interface ListingClaimAttachment {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string | null
  byteSize: number | null
}

export interface ListingClaimRequest {
  id: string
  listingId: string
  listingTitle: string
  requesterName: string
  requesterPhone: string
  requesterEmail: string | null
  message: string | null
  attachments: ListingClaimAttachment[]
  status: ListingClaimStatus
  assignedHostId: string | null
  createdAt: string
  resolvedAt: string | null
}
