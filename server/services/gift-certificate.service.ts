import type {
  GiftCertificateHostPurchase,
  GiftCertificateOffer,
  GiftCertificatePurchase,
  GiftCertificatePurchasePublic,
  HostGiftCertificateSalesReport,
} from '#shared/types/gift-certificate'
import type {
  CreateGiftCertificatePurchaseInput,
  UpsertGiftCertificateOffersInput,
} from '#shared/schemas/gift-certificate'
import {
  GIFT_CERTIFICATE_METADATA_KIND,
  GIFT_CERTIFICATE_NOMINALS_RUB,
  GIFT_CERTIFICATE_VALIDITY_DAYS,
} from '#shared/constants/gift-certificate'
import {
  generateGiftCertificateCode,
  splitGiftCertificateSettlement,
} from '#shared/utils/gift-certificate'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { giftCertificateOffers, giftCertificatePurchases, listings } from '../db/schema'
import { buildBookingPaymentSplit } from '../utils/booking-payment-split'
import { getDb } from '../utils/db'
import {
  allowYookassaMock,
  paymentsNotConfiguredError,
} from '../utils/dev-guards'
import {
  createYookassaClient,
  formatYookassaAmount,
  mapYookassaStatus,
} from '../utils/yookassa'
import { hostPayoutService } from './host-payout.service'

const mapOffer = (row: typeof giftCertificateOffers.$inferSelect): GiftCertificateOffer => ({
  id: row.id,
  listingId: row.listingId,
  hostId: row.hostId,
  amountRub: row.amountRub,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const mapPurchase = (row: typeof giftCertificatePurchases.$inferSelect): GiftCertificatePurchase => ({
  id: row.id,
  offerId: row.offerId,
  listingId: row.listingId,
  hostId: row.hostId,
  buyerId: row.buyerId,
  recipientName: row.recipientName,
  totalPrice: row.totalPrice,
  hostAmount: row.hostAmount,
  platformFee: row.platformFee,
  code: row.code,
  status: row.status,
  expiresAt: row.expiresAt?.toISOString() ?? null,
  redeemedAt: row.redeemedAt?.toISOString() ?? null,
  confirmationUrl: row.confirmationUrl,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const getYookassaConfig = () => {
  const config = useRuntimeConfig()
  const shopId = config.yookassaShopId as string
  const secretKey = config.yookassaSecretKey as string
  const keysMissing = !shopId || !secretKey

  return {
    shopId,
    secretKey,
    siteUrl: config.public.siteUrl as string,
    keysMissing,
    useMock: allowYookassaMock(keysMissing),
  }
}

const assertPaymentsAvailable = () => {
  const config = getYookassaConfig()

  if (config.keysMissing && !config.useMock) {
    throw paymentsNotConfiguredError()
  }

  return config
}

const getPurchaseReturnUrl = (purchaseId: string) => {
  const { siteUrl } = getYookassaConfig()
  return `${siteUrl}/gift-certificates/purchases/${purchaseId}/pay?return=1`
}

const assertHostOwnsListing = async (listingId: string, hostId: string) => {
  const db = getDb()
  const [listing] = await db.select({
    id: listings.id,
    hostId: listings.hostId,
    title: listings.title,
    status: listings.status,
  }).from(listings).where(eq(listings.id, listingId)).limit(1)

  if (!listing || listing.hostId !== hostId) {
    throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
  }

  return listing
}

const fulfillPaidPurchase = async (purchaseId: string) => {
  const db = getDb()
  const [existing] = await db.select().from(giftCertificatePurchases)
    .where(eq(giftCertificatePurchases.id, purchaseId))
    .limit(1)

  if (!existing) {
    return null
  }

  if (existing.status === 'paid' || existing.status === 'redeemed') {
    return mapPurchase(existing)
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + GIFT_CERTIFICATE_VALIDITY_DAYS)

  const [updated] = await db.update(giftCertificatePurchases)
    .set({
      status: 'paid',
      code: existing.code ?? generateGiftCertificateCode(),
      expiresAt: existing.expiresAt ?? expiresAt,
      updatedAt: new Date(),
    })
    .where(and(
      eq(giftCertificatePurchases.id, purchaseId),
      eq(giftCertificatePurchases.status, 'pending'),
    ))
    .returning()

  return updated ? mapPurchase(updated) : mapPurchase(existing)
}

export const giftCertificateService = {
  listNominals: () => [...GIFT_CERTIFICATE_NOMINALS_RUB],

  listOffersForListing: async (listingId: string, activeOnly = false) => {
    const db = getDb()
    const rows = await db.select().from(giftCertificateOffers)
      .where(and(
        eq(giftCertificateOffers.listingId, listingId),
        ...(activeOnly ? [eq(giftCertificateOffers.isActive, true)] : []),
      ))
      .orderBy(asc(giftCertificateOffers.amountRub))

    return rows.map(mapOffer)
  },

  upsertOffersForListing: async (
    listingId: string,
    hostId: string,
    input: UpsertGiftCertificateOffersInput,
  ) => {
    await assertHostOwnsListing(listingId, hostId)
    const db = getDb()
    const now = new Date()
    const uniqueAmounts = [...new Set(input.amountsRub)].sort((a, b) => a - b)

    if (!uniqueAmounts.length) {
      return []
    }

    const rows = await db.insert(giftCertificateOffers).values(
      uniqueAmounts.map(amountRub => ({
        listingId,
        hostId,
        amountRub,
        isActive: true,
        updatedAt: now,
      })),
    ).onConflictDoUpdate({
      target: [giftCertificateOffers.listingId, giftCertificateOffers.amountRub],
      set: { isActive: true, updatedAt: now },
    }).returning()

    await db.update(giftCertificateOffers)
      .set({ isActive: false, updatedAt: now })
      .where(and(
        eq(giftCertificateOffers.listingId, listingId),
        inArray(
          giftCertificateOffers.amountRub,
          GIFT_CERTIFICATE_NOMINALS_RUB.filter(amount => !uniqueAmounts.includes(amount)),
        ),
      ))

    return rows.map(mapOffer).sort((a, b) => a.amountRub - b.amountRub)
  },

  createPurchase: async (buyerId: string, input: CreateGiftCertificatePurchaseInput) => {
    const db = getDb()
    const [offer] = await db.select().from(giftCertificateOffers)
      .where(and(
        eq(giftCertificateOffers.id, input.offerId),
        eq(giftCertificateOffers.isActive, true),
      ))
      .limit(1)

    if (!offer) {
      throw createError({ statusCode: 404, statusMessage: 'Gift certificate offer not found' })
    }

    const [listing] = await db.select({
      id: listings.id,
      title: listings.title,
      status: listings.status,
    }).from(listings).where(eq(listings.id, offer.listingId)).limit(1)

    if (!listing || listing.status !== 'published') {
      throw createError({ statusCode: 400, statusMessage: 'Listing is not available' })
    }

    const payoutReady = await hostPayoutService.isReadyForBookingPayments(offer.hostId)

    const { shopId, secretKey, useMock } = assertPaymentsAvailable()

    if (!payoutReady && !useMock) {
      throw createError({
        statusCode: 409,
        statusMessage: 'HOST_PAYOUT_NOT_READY',
        data: { code: 'HOST_PAYOUT_NOT_READY' },
      })
    }

    const { hostAmount, platformFee } = splitGiftCertificateSettlement(offer.amountRub)

    const [created] = await db.insert(giftCertificatePurchases).values({
      offerId: offer.id,
      listingId: offer.listingId,
      hostId: offer.hostId,
      buyerId,
      recipientName: input.recipientName?.trim() || null,
      totalPrice: offer.amountRub,
      hostAmount,
      platformFee,
      status: 'pending',
    }).returning()

    const returnUrl = getPurchaseReturnUrl(created.id)

    if (useMock) {
      const [mockPaid] = await db.update(giftCertificatePurchases)
        .set({
          yookassaPaymentId: `mock-gift-${crypto.randomUUID()}`,
          confirmationUrl: returnUrl,
          updatedAt: new Date(),
        })
        .where(eq(giftCertificatePurchases.id, created.id))
        .returning()

      const fulfilled = await fulfillPaidPurchase(mockPaid.id)

      return {
        purchase: fulfilled!,
        confirmationUrl: returnUrl,
      }
    }

    const payoutProfile = await hostPayoutService.getForUser(offer.hostId)
    const recipientId = payoutProfile.yookassaRecipientId

    if (!recipientId) {
      throw createError({
        statusCode: 409,
        statusMessage: 'HOST_PAYOUT_NOT_READY',
        data: { code: 'HOST_PAYOUT_NOT_READY' },
      })
    }

    const split = buildBookingPaymentSplit({
      bookingId: created.id,
      hostAmount,
      platformFee,
      totalPrice: offer.amountRub,
      cashDue: offer.amountRub,
      yookassaRecipientId: recipientId,
      hostLegalName: listing.title,
    })

    const client = createYookassaClient(shopId, secretKey)
    const yookassaPayment = await client.createPayment({
      amount: formatYookassaAmount(offer.amountRub),
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: split.description,
      metadata: {
        kind: GIFT_CERTIFICATE_METADATA_KIND,
        purchaseId: created.id,
      },
      transfers: split.transfers,
    }, crypto.randomUUID())

    const confirmationUrl = yookassaPayment.confirmation?.confirmation_url

    if (!confirmationUrl) {
      throw createError({ statusCode: 502, statusMessage: 'Missing confirmation URL' })
    }

    const mappedStatus = mapYookassaStatus(yookassaPayment.status)

    const [updated] = await db.update(giftCertificatePurchases)
      .set({
        yookassaPaymentId: yookassaPayment.id,
        confirmationUrl,
        updatedAt: new Date(),
      })
      .where(eq(giftCertificatePurchases.id, created.id))
      .returning()

    if (mappedStatus === 'succeeded' || mappedStatus === 'waiting_for_capture') {
      const fulfilled = await fulfillPaidPurchase(updated.id)
      return {
        purchase: fulfilled ?? mapPurchase(updated),
        confirmationUrl,
      }
    }

    return {
      purchase: mapPurchase(updated),
      confirmationUrl,
    }
  },

  getPurchaseForBuyer: async (purchaseId: string, buyerId: string, sync = false) => {
    const db = getDb()
    const [row] = await db.select().from(giftCertificatePurchases)
      .where(eq(giftCertificatePurchases.id, purchaseId))
      .limit(1)

    if (!row || row.buyerId !== buyerId) {
      throw createError({ statusCode: 404, statusMessage: 'Purchase not found' })
    }

    if (!sync || !row.yookassaPaymentId || row.status !== 'pending') {
      return mapPurchase(row)
    }

    const config = getYookassaConfig()

    if (config.useMock) {
      return mapPurchase(row)
    }

    if (config.keysMissing) {
      throw paymentsNotConfiguredError()
    }

    const auth = Buffer.from(`${config.shopId}:${config.secretKey}`).toString('base64')
    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${row.yookassaPaymentId}`,
      { headers: { Authorization: `Basic ${auth}` } },
    )

    if (!response.ok) {
      return mapPurchase(row)
    }

    const data = await response.json()
    const mappedStatus = mapYookassaStatus(data.status)

    if (mappedStatus === 'succeeded' || mappedStatus === 'waiting_for_capture') {
      return (await fulfillPaidPurchase(purchaseId)) ?? mapPurchase(row)
    }

    if (mappedStatus === 'cancelled') {
      const [updated] = await db.update(giftCertificatePurchases)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(giftCertificatePurchases.id, purchaseId))
        .returning()

      return mapPurchase(updated)
    }

    return mapPurchase(row)
  },

  getPurchasePublic: async (purchaseId: string, buyerId: string): Promise<GiftCertificatePurchasePublic> => {
    const purchase = await giftCertificateService.getPurchaseForBuyer(purchaseId, buyerId)
    const db = getDb()
    const [listing] = await db.select({
      title: listings.title,
      city: listings.city,
    }).from(listings).where(eq(listings.id, purchase.listingId)).limit(1)

    return {
      ...purchase,
      listingTitle: listing?.title ?? 'Listing',
      listingCity: listing?.city ?? '',
    }
  },

  listPurchasesForBuyer: async (buyerId: string) => {
    const db = getDb()
    const rows = await db.select().from(giftCertificatePurchases)
      .where(eq(giftCertificatePurchases.buyerId, buyerId))
      .orderBy(asc(giftCertificatePurchases.createdAt))

    return rows.map(mapPurchase).reverse()
  },

  listSalesForHost: async (hostId: string): Promise<HostGiftCertificateSalesReport> => {
    const db = getDb()
    const rows = await db.select({
      purchase: giftCertificatePurchases,
      listingTitle: listings.title,
    })
      .from(giftCertificatePurchases)
      .innerJoin(listings, eq(giftCertificatePurchases.listingId, listings.id))
      .where(and(
        eq(giftCertificatePurchases.hostId, hostId),
        inArray(giftCertificatePurchases.status, ['paid', 'redeemed']),
      ))
      .orderBy(desc(giftCertificatePurchases.createdAt))

    const purchases: GiftCertificateHostPurchase[] = rows.map(({ purchase, listingTitle }) => ({
      id: purchase.id,
      listingId: purchase.listingId,
      listingTitle,
      totalPrice: purchase.totalPrice,
      hostAmount: purchase.hostAmount,
      platformFee: purchase.platformFee,
      status: purchase.status,
      expiresAt: purchase.expiresAt?.toISOString() ?? null,
      redeemedAt: purchase.redeemedAt?.toISOString() ?? null,
      createdAt: purchase.createdAt.toISOString(),
    }))

    const summary = purchases.reduce(
      (acc, row) => ({
        soldCount: acc.soldCount + 1,
        hostAmountRub: acc.hostAmountRub + row.hostAmount,
        platformFeeRub: acc.platformFeeRub + row.platformFee,
      }),
      { soldCount: 0, hostAmountRub: 0, platformFeeRub: 0 },
    )

    return { purchases, summary }
  },

  resolveRedemption: async (code: string, listingId: string) => {
    const normalized = code.trim().toUpperCase()
    const db = getDb()
    const [purchase] = await db.select().from(giftCertificatePurchases)
      .where(eq(giftCertificatePurchases.code, normalized))
      .limit(1)

    if (!purchase || purchase.status !== 'paid') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid or already used gift certificate' })
    }

    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      throw createError({ statusCode: 400, statusMessage: 'Gift certificate expired' })
    }

    const [listing] = await db.select({
      id: listings.id,
      propertyListingId: listings.propertyListingId,
    }).from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    const certListingId = purchase.listingId
    const matchesListing = listing.id === certListingId
      || listing.propertyListingId === certListingId

    if (!matchesListing) {
      throw createError({ statusCode: 400, statusMessage: 'Gift certificate is for another property' })
    }

    const [offer] = await db.select({ amountRub: giftCertificateOffers.amountRub })
      .from(giftCertificateOffers)
      .where(eq(giftCertificateOffers.id, purchase.offerId))
      .limit(1)

    return {
      purchaseId: purchase.id,
      creditRub: offer?.amountRub ?? purchase.totalPrice,
    }
  },

  markRedeemed: async (purchaseId: string) => {
    const db = getDb()
    await db.update(giftCertificatePurchases)
      .set({
        status: 'redeemed',
        redeemedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(giftCertificatePurchases.id, purchaseId))
  },

  handleWebhook: async (event: string, object: {
    id: string
    status: string
    metadata?: Record<string, string>
  }) => {
    if (object.metadata?.kind !== GIFT_CERTIFICATE_METADATA_KIND || !object.metadata.purchaseId) {
      return null
    }

    const db = getDb()
    const [row] = await db.select().from(giftCertificatePurchases)
      .where(eq(giftCertificatePurchases.yookassaPaymentId, object.id))
      .limit(1)

    if (!row) {
      return null
    }

    if (event === 'payment.succeeded' || object.status === 'succeeded') {
      return fulfillPaidPurchase(row.id)
    }

    if (event === 'payment.canceled' || object.status === 'canceled') {
      const [updated] = await db.update(giftCertificatePurchases)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(giftCertificatePurchases.id, row.id))
        .returning()

      return updated ? mapPurchase(updated) : null
    }

    return mapPurchase(row)
  },
}
