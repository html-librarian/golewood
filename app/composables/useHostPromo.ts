import type {
  HostPromoAccountSummary,
  HostPromoPurchase,
  ListingPromotion,
  PromotionProduct,
} from '#shared/types/promotion'
import type { PurchaseHostPromoPointsInput } from '#shared/schemas/host-promo-purchase'
import type { PurchasePromotionInput } from '#shared/schemas/promotion'

export interface CreateHostPromoPurchaseResult {
  purchase: HostPromoPurchase
  confirmationUrl: string | null
}

export interface HostListingPromotionsResponse {
  active: ListingPromotion[]
  history: ListingPromotion[]
  products: PromotionProduct[]
  balance: number
}

export const useHostPromo = () => {
  const { authHeaders } = useAuth()

  const fetchPromoAccount = () =>
    $fetch<HostPromoAccountSummary>('/api/host/promo', { headers: authHeaders.value })

  const fetchListingPromotions = (listingId: string) =>
    $fetch<HostListingPromotionsResponse>(`/api/host/listings/${listingId}/promotions`, {
      headers: authHeaders.value,
    })

  const purchasePromotion = (listingId: string, body: PurchasePromotionInput) =>
    $fetch(`/api/host/listings/${listingId}/promotions`, {
      method: 'POST',
      headers: authHeaders.value,
      body,
    })

  const purchasePoints = (body: PurchaseHostPromoPointsInput) =>
    $fetch<CreateHostPromoPurchaseResult>('/api/host/promo/purchases', {
      method: 'POST',
      headers: authHeaders.value,
      body,
    })

  const fetchPointsPurchase = (purchaseId: string, sync = false) =>
    $fetch<HostPromoPurchase>(`/api/host/promo/purchases/${purchaseId}`, {
      headers: authHeaders.value,
      query: sync ? { return: '1' } : undefined,
    })

  return {
    fetchPromoAccount,
    fetchListingPromotions,
    purchasePromotion,
    purchasePoints,
    fetchPointsPurchase,
  }
}
