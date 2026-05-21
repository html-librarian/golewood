import { z } from 'zod'
import { HOST_PROMO_POINT_PACKAGES } from '#shared/constants/host-promo-packages'

const packageSlugs = HOST_PROMO_POINT_PACKAGES.map(item => item.slug) as [string, ...string[]]

export const purchaseHostPromoPointsSchema = z.object({
  packageSlug: z.enum(packageSlugs),
})

export type PurchaseHostPromoPointsInput = z.infer<typeof purchaseHostPromoPointsSchema>
