export type GiftCertificatePurchaseStatus = 'pending' | 'paid' | 'redeemed' | 'cancelled'

export interface GiftCertificateOffer {
  id: string
  listingId: string
  hostId: string
  amountRub: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GiftCertificateOfferWithListing extends GiftCertificateOffer {
  listingTitle: string
  listingCity: string
}

export interface GiftCertificatePurchase {
  id: string
  offerId: string
  listingId: string
  hostId: string
  buyerId: string
  recipientName: string | null
  totalPrice: number
  hostAmount: number
  platformFee: number
  code: string | null
  status: GiftCertificatePurchaseStatus
  expiresAt: string | null
  redeemedAt: string | null
  confirmationUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface GiftCertificatePurchasePublic extends GiftCertificatePurchase {
  listingTitle: string
  listingCity: string
}

/** Host sales report — без кода сертификата и данных покупателя */
export interface GiftCertificateHostPurchase {
  id: string
  listingId: string
  listingTitle: string
  totalPrice: number
  hostAmount: number
  platformFee: number
  status: GiftCertificatePurchaseStatus
  expiresAt: string | null
  redeemedAt: string | null
  createdAt: string
}

export interface HostGiftCertificateSalesReport {
  purchases: GiftCertificateHostPurchase[]
  summary: {
    soldCount: number
    hostAmountRub: number
    platformFeeRub: number
  }
}
