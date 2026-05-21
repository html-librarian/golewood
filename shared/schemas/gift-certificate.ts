import { z } from 'zod'
import { GIFT_CERTIFICATE_NOMINALS_RUB } from '#shared/constants/gift-certificate'

const nominalSchema = z.number().int().refine(
  value => GIFT_CERTIFICATE_NOMINALS_RUB.includes(value as typeof GIFT_CERTIFICATE_NOMINALS_RUB[number]),
  { message: 'Invalid nominal amount' },
)

export const upsertGiftCertificateOffersSchema = z.object({
  amountsRub: z.array(nominalSchema).min(1).max(GIFT_CERTIFICATE_NOMINALS_RUB.length),
})

export const createGiftCertificatePurchaseSchema = z.object({
  offerId: z.string().uuid(),
  recipientName: z.string().trim().max(100).optional(),
})

export const giftCertificateRedeemPreviewSchema = z.object({
  code: z.string().trim().min(4).max(32),
})

export type UpsertGiftCertificateOffersInput = z.infer<typeof upsertGiftCertificateOffersSchema>
export type CreateGiftCertificatePurchaseInput = z.infer<typeof createGiftCertificatePurchaseSchema>
export type GiftCertificateRedeemPreviewInput = z.infer<typeof giftCertificateRedeemPreviewSchema>
