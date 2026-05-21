import type {
  GiftCertificateOffer,
  GiftCertificatePurchase,
  GiftCertificatePurchasePublic,
  HostGiftCertificateSalesReport,
} from '#shared/types/gift-certificate'
import type {
  CreateGiftCertificatePurchaseInput,
  GiftCertificateRedeemPreviewInput,
  UpsertGiftCertificateOffersInput,
} from '#shared/schemas/gift-certificate'

export interface CreateGiftCertificatePurchaseResult {
  purchase: GiftCertificatePurchase
  confirmationUrl: string | null
}

export interface HostGiftCertificateOffersResponse {
  nominals: number[]
  offers: GiftCertificateOffer[]
}

export const useGiftCertificates = () => {
  const { authHeaders } = useAuth()

  const fetchListingOffers = (listingId: string) =>
    $fetch<GiftCertificateOffer[]>(`/api/listings/${listingId}/gift-certificates/offers`)

  const previewRedemption = (listingId: string, body: GiftCertificateRedeemPreviewInput) =>
    $fetch<{ creditRub: number }>(`/api/listings/${listingId}/gift-certificates/redeem-preview`, {
      method: 'POST',
      body,
    })

  const fetchHostOffers = (listingId: string) =>
    $fetch<HostGiftCertificateOffersResponse>(`/api/host/listings/${listingId}/gift-certificates/offers`, {
      headers: authHeaders.value,
    })

  const saveHostOffers = (listingId: string, body: UpsertGiftCertificateOffersInput) =>
    $fetch<GiftCertificateOffer[]>(`/api/host/listings/${listingId}/gift-certificates/offers`, {
      method: 'PUT',
      headers: authHeaders.value,
      body,
    })

  const createPurchase = (body: CreateGiftCertificatePurchaseInput) =>
    $fetch<CreateGiftCertificatePurchaseResult>('/api/gift-certificates/purchases', {
      method: 'POST',
      headers: authHeaders.value,
      body,
    })

  const fetchPurchase = (purchaseId: string, sync = false) =>
    $fetch<GiftCertificatePurchasePublic>(`/api/gift-certificates/purchases/${purchaseId}`, {
      headers: authHeaders.value,
      query: sync ? { return: '1' } : undefined,
    })

  const fetchMyPurchases = () =>
    $fetch<GiftCertificatePurchase[]>('/api/gift-certificates/purchases', {
      headers: authHeaders.value,
    })

  const fetchHostSales = () =>
    $fetch<HostGiftCertificateSalesReport>('/api/host/gift-certificates/purchases', {
      headers: authHeaders.value,
    })

  return {
    fetchListingOffers,
    previewRedemption,
    fetchHostOffers,
    saveHostOffers,
    createPurchase,
    fetchPurchase,
    fetchMyPurchases,
    fetchHostSales,
  }
}
