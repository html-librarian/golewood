import type { HostPromoPurchase } from '#shared/types/promotion'
import type { PurchaseHostPromoPointsInput } from '#shared/schemas/host-promo-purchase'
import { getHostPromoPointPackage } from '#shared/constants/host-promo-packages'
import { eq } from 'drizzle-orm'
import { hostPromoPurchases, hostPromoTransactions, users } from '../db/schema'
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

const HOST_PROMO_PURCHASE_METADATA_KIND = 'host_promo_purchase'

const mapPurchase = (row: typeof hostPromoPurchases.$inferSelect): HostPromoPurchase => ({
  id: row.id,
  userId: row.userId,
  packageSlug: row.packageSlug,
  points: row.points,
  amountRub: row.amountRub,
  status: row.status === 'cancelled' || row.status === 'refunded'
    ? 'cancelled'
    : row.status === 'succeeded' || row.status === 'waiting_for_capture'
      ? 'succeeded'
      : 'pending',
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
  return `${siteUrl}/host/promo/buy?purchase=${purchaseId}&return=1`
}

const fulfillPurchase = async (purchaseId: string) => {
  const db = getDb()

  return db.transaction(async (tx) => {
    const [purchase] = await tx.select().from(hostPromoPurchases)
      .where(eq(hostPromoPurchases.id, purchaseId))
      .limit(1)

    if (!purchase) {
      return null
    }

    if (purchase.status === 'succeeded' || purchase.promoTransactionId) {
      return mapPurchase(purchase)
    }

    const [user] = await tx.select({ hostPromoBalance: users.hostPromoBalance })
      .from(users)
      .where(eq(users.id, purchase.userId))
      .limit(1)

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    const nextBalance = user.hostPromoBalance + purchase.points

    const [updatedUser] = await tx.update(users)
      .set({ hostPromoBalance: nextBalance, updatedAt: new Date() })
      .where(eq(users.id, purchase.userId))
      .returning({ hostPromoBalance: users.hostPromoBalance })

    const [promoTransaction] = await tx.insert(hostPromoTransactions).values({
      userId: purchase.userId,
      amount: purchase.points,
      type: 'points_purchase',
      balanceAfter: updatedUser.hostPromoBalance,
    }).returning()

    const [updated] = await tx.update(hostPromoPurchases)
      .set({
        status: 'succeeded',
        promoTransactionId: promoTransaction.id,
        updatedAt: new Date(),
      })
      .where(eq(hostPromoPurchases.id, purchaseId))
      .returning()

    return mapPurchase(updated)
  })
}

const assertOwnsPurchase = async (purchaseId: string, userId: string) => {
  const db = getDb()
  const [row] = await db.select().from(hostPromoPurchases)
    .where(eq(hostPromoPurchases.id, purchaseId))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Purchase not found' })
  }

  if (row.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return row
}

export const hostPromoPurchaseService = {
  create: async (userId: string, input: PurchaseHostPromoPointsInput) => {
    const pkg = getHostPromoPointPackage(input.packageSlug)

    if (!pkg) {
      throw createError({ statusCode: 400, statusMessage: 'Unknown package' })
    }

    const db = getDb()
    const { shopId, secretKey, useMock } = assertPaymentsAvailable()

    const [created] = await db.insert(hostPromoPurchases).values({
      userId,
      packageSlug: pkg.slug,
      points: pkg.points,
      amountRub: pkg.priceRub,
      status: 'pending',
    }).returning()

    const purchaseReturnUrl = getPurchaseReturnUrl(created.id)

    if (useMock) {
      const [mockPaid] = await db.update(hostPromoPurchases)
        .set({
          yookassaPaymentId: `mock-promo-${crypto.randomUUID()}`,
          status: 'succeeded',
          confirmationUrl: purchaseReturnUrl,
          updatedAt: new Date(),
        })
        .where(eq(hostPromoPurchases.id, created.id))
        .returning()

      await fulfillPurchase(mockPaid.id)

      const [fulfilled] = await db.select().from(hostPromoPurchases)
        .where(eq(hostPromoPurchases.id, created.id))
        .limit(1)

      return {
        purchase: mapPurchase(fulfilled!),
        confirmationUrl: purchaseReturnUrl,
      }
    }

    const client = createYookassaClient(shopId, secretKey)
    const yookassaPayment = await client.createPayment({
      amount: formatYookassaAmount(pkg.priceRub),
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: purchaseReturnUrl,
      },
      description: `Golewood promo points: ${pkg.points}`,
      metadata: {
        kind: HOST_PROMO_PURCHASE_METADATA_KIND,
        purchaseId: created.id,
      },
    }, crypto.randomUUID())

    const confirmationUrl = yookassaPayment.confirmation?.confirmation_url

    if (!confirmationUrl) {
      throw createError({ statusCode: 502, statusMessage: 'Missing confirmation URL' })
    }

    const [updated] = await db.update(hostPromoPurchases)
      .set({
        yookassaPaymentId: yookassaPayment.id,
        status: mapYookassaStatus(yookassaPayment.status),
        confirmationUrl,
        updatedAt: new Date(),
      })
      .where(eq(hostPromoPurchases.id, created.id))
      .returning()

    if (updated.status === 'succeeded') {
      await fulfillPurchase(updated.id)
      const [fulfilled] = await db.select().from(hostPromoPurchases)
        .where(eq(hostPromoPurchases.id, created.id))
        .limit(1)

      return {
        purchase: mapPurchase(fulfilled!),
        confirmationUrl,
      }
    }

    return {
      purchase: mapPurchase(updated),
      confirmationUrl,
    }
  },

  getForUser: async (purchaseId: string, userId: string, sync = false) => {
    const row = await assertOwnsPurchase(purchaseId, userId)

    if (!sync || !row.yookassaPaymentId) {
      return mapPurchase(row)
    }

    const config = getYookassaConfig()

    if (config.useMock || row.status === 'succeeded') {
      return mapPurchase(row)
    }

    if (config.keysMissing) {
      throw paymentsNotConfiguredError()
    }

    const { shopId, secretKey } = config

    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64')
    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${row.yookassaPaymentId}`,
      { headers: { Authorization: `Basic ${auth}` } },
    )

    if (!response.ok) {
      return mapPurchase(row)
    }

    const data = await response.json()
    const db = getDb()
    const mappedStatus = mapYookassaStatus(data.status)

    const [updated] = await db.update(hostPromoPurchases)
      .set({ status: mappedStatus, updatedAt: new Date() })
      .where(eq(hostPromoPurchases.id, purchaseId))
      .returning()

    if (mappedStatus === 'succeeded') {
      return (await fulfillPurchase(purchaseId)) ?? mapPurchase(updated)
    }

    return mapPurchase(updated)
  },

  handleWebhook: async (event: string, object: {
    id: string
    status: string
    metadata?: Record<string, string>
  }) => {
    if (object.metadata?.kind !== HOST_PROMO_PURCHASE_METADATA_KIND || !object.metadata.purchaseId) {
      return null
    }

    const db = getDb()
    const [row] = await db.select().from(hostPromoPurchases)
      .where(eq(hostPromoPurchases.yookassaPaymentId, object.id))
      .limit(1)

    if (!row) {
      return null
    }

    if (event === 'payment.succeeded' || object.status === 'succeeded') {
      await db.update(hostPromoPurchases)
        .set({ status: 'succeeded', updatedAt: new Date() })
        .where(eq(hostPromoPurchases.id, row.id))

      return fulfillPurchase(row.id)
    }

    if (event === 'payment.canceled' || object.status === 'canceled') {
      const [updated] = await db.update(hostPromoPurchases)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(hostPromoPurchases.id, row.id))
        .returning()

      return mapPurchase(updated)
    }

    return mapPurchase(row)
  },
}
