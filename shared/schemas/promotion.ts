import { z } from 'zod'
import { PROMOTION_PRODUCT_SLUGS } from '#shared/types/promotion'

export const purchasePromotionSchema = z.object({
  productSlug: z.enum(PROMOTION_PRODUCT_SLUGS),
})

export type PurchasePromotionInput = z.infer<typeof purchasePromotionSchema>
