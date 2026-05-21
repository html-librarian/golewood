import type { HostPromoAccountSummary, HostPromoTransaction, HostPromoTransactionType } from '#shared/types/promotion'
import { HOST_PROMO_POINT_PACKAGES } from '#shared/constants/host-promo-packages'
import { PROMOTION_PRODUCTS } from '#shared/constants/promotions'
import { calculateHostPromoBookingReward } from '#shared/utils/promotion'
import { desc, eq } from 'drizzle-orm'
import { hostPromoTransactions, users } from '../db/schema'
import { getDb } from '../utils/db'

const mapTransaction = (row: typeof hostPromoTransactions.$inferSelect): HostPromoTransaction => ({
  id: row.id,
  userId: row.userId,
  amount: row.amount,
  type: row.type,
  listingId: row.listingId,
  promotionId: row.promotionId,
  balanceAfter: row.balanceAfter,
  createdAt: row.createdAt.toISOString(),
})

const applyBalanceChange = async (
  userId: string,
  amount: number,
  type: HostPromoTransactionType,
  refs: { listingId?: string, promotionId?: string },
) => {
  const db = getDb()

  return db.transaction(async (tx) => {
    const [user] = await tx.select({ hostPromoBalance: users.hostPromoBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    const nextBalance = user.hostPromoBalance + amount

    if (nextBalance < 0) {
      throw createError({ statusCode: 400, statusMessage: 'Insufficient promo balance' })
    }

    const [updated] = await tx.update(users)
      .set({ hostPromoBalance: nextBalance, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ hostPromoBalance: users.hostPromoBalance })

    const [transaction] = await tx.insert(hostPromoTransactions).values({
      userId,
      amount,
      type,
      listingId: refs.listingId ?? null,
      promotionId: refs.promotionId ?? null,
      balanceAfter: updated.hostPromoBalance,
    }).returning()

    return mapTransaction(transaction)
  })
}

export const hostPromoService = {
  getBalance: async (userId: string) => {
    const db = getDb()
    const [row] = await db.select({ hostPromoBalance: users.hostPromoBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return row?.hostPromoBalance ?? 0
  },

  getAccountSummary: async (userId: string, limit = 30): Promise<HostPromoAccountSummary> => {
    const db = getDb()
    const balance = await hostPromoService.getBalance(userId)
    const rows = await db.select().from(hostPromoTransactions)
      .where(eq(hostPromoTransactions.userId, userId))
      .orderBy(desc(hostPromoTransactions.createdAt))
      .limit(limit)

    return {
      balance,
      transactions: rows.map(mapTransaction),
      products: PROMOTION_PRODUCTS,
      pointPackages: HOST_PROMO_POINT_PACKAGES,
    }
  },

  creditBookingReward: async (hostId: string, listingId: string, totalPrice: number) => {
    const amount = calculateHostPromoBookingReward(totalPrice)

    if (amount <= 0) {
      return null
    }

    return applyBalanceChange(hostId, amount, 'booking_reward', { listingId })
  },

  spendForPromotion: async (
    hostId: string,
    listingId: string,
    promotionId: string,
    pricePoints: number,
  ) => {
    return applyBalanceChange(hostId, -pricePoints, 'promotion_purchase', {
      listingId,
      promotionId,
    })
  },

  creditPointsPurchase: async (userId: string, points: number) =>
    applyBalanceChange(userId, points, 'points_purchase', {}),
}
