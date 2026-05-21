import type { BonusAccountSummary, BonusTransaction, BonusTransactionType } from '#shared/types/bonus'
import {
  BONUS_MAX_BOOKING_PERCENT,
  BONUS_MIN_CASH_PAYMENT,
  BONUS_REVIEW_REWARD_MAX,
  BONUS_REVIEW_REWARD_PERCENT,
  calculateReviewBonusReward,
  clampBonusToApply,
} from '#shared/utils/bonus'
import { and, desc, eq } from 'drizzle-orm'
import { bonusTransactions, bookings, reviews, users } from '../db/schema'
import { getDb } from '../utils/db'

const mapTransaction = (row: typeof bonusTransactions.$inferSelect): BonusTransaction => ({
  id: row.id,
  userId: row.userId,
  amount: row.amount,
  type: row.type,
  bookingId: row.bookingId,
  reviewId: row.reviewId,
  balanceAfter: row.balanceAfter,
  createdAt: row.createdAt.toISOString(),
})

const applyBalanceChange = async (
  userId: string,
  amount: number,
  type: BonusTransactionType,
  refs: { bookingId?: string, reviewId?: string },
) => {
  const db = getDb()

  return db.transaction(async (tx) => {
    const [user] = await tx.select({ bonusBalance: users.bonusBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    const nextBalance = user.bonusBalance + amount

    if (nextBalance < 0) {
      throw createError({ statusCode: 400, statusMessage: 'Insufficient bonus balance' })
    }

    const [updated] = await tx.update(users)
      .set({ bonusBalance: nextBalance, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ bonusBalance: users.bonusBalance })

    const [transaction] = await tx.insert(bonusTransactions).values({
      userId,
      amount,
      type,
      bookingId: refs.bookingId ?? null,
      reviewId: refs.reviewId ?? null,
      balanceAfter: updated.bonusBalance,
    }).returning()

    return mapTransaction(transaction)
  })
}

export const bonusService = {
  getBalance: async (userId: string) => {
    const db = getDb()
    const [row] = await db.select({ bonusBalance: users.bonusBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return row?.bonusBalance ?? 0
  },

  getAccountSummary: async (userId: string, limit = 20): Promise<BonusAccountSummary> => {
    const db = getDb()
    const balance = await bonusService.getBalance(userId)
    const rows = await db.select().from(bonusTransactions)
      .where(eq(bonusTransactions.userId, userId))
      .orderBy(desc(bonusTransactions.createdAt))
      .limit(limit)

    return {
      balance,
      transactions: rows.map(mapTransaction),
      rules: {
        maxBookingPercent: BONUS_MAX_BOOKING_PERCENT,
        minCashPayment: BONUS_MIN_CASH_PAYMENT,
        reviewRewardPercent: BONUS_REVIEW_REWARD_PERCENT,
        reviewRewardMax: BONUS_REVIEW_REWARD_MAX,
      },
    }
  },

  resolveBonusToApply: async (userId: string, totalPrice: number, requested: number) => {
    const balance = await bonusService.getBalance(userId)
    const bonusToApply = clampBonusToApply(totalPrice, balance, requested)

    if (bonusToApply > 0 && bonusToApply > balance) {
      throw createError({ statusCode: 400, statusMessage: 'Insufficient bonus balance' })
    }

    return bonusToApply
  },

  spendForBooking: async (userId: string, bookingId: string, amount: number) => {
    if (amount <= 0) {
      return null
    }

    return applyBalanceChange(userId, -amount, 'booking_payment', { bookingId })
  },

  refundForBooking: async (userId: string, bookingId: string, amount: number) => {
    if (amount <= 0) {
      return null
    }

    const db = getDb()
    const [existing] = await db.select({ id: bonusTransactions.id })
      .from(bonusTransactions)
      .where(and(
        eq(bonusTransactions.bookingId, bookingId),
        eq(bonusTransactions.type, 'booking_refund'),
      ))
      .limit(1)

    if (existing) {
      return null
    }

    return applyBalanceChange(userId, amount, 'booking_refund', { bookingId })
  },

  creditForApprovedReview: async (reviewId: string) => {
    const db = getDb()
    const [row] = await db.select({
      review: reviews,
      bookingTotal: bookings.totalPrice,
      guestId: bookings.guestId,
    })
      .from(reviews)
      .innerJoin(bookings, eq(reviews.bookingId, bookings.id))
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (!row || row.review.status !== 'approved') {
      return null
    }

    const [existing] = await db.select({ id: bonusTransactions.id })
      .from(bonusTransactions)
      .where(and(
        eq(bonusTransactions.reviewId, reviewId),
        eq(bonusTransactions.type, 'review_reward'),
      ))
      .limit(1)

    if (existing) {
      return null
    }

    const reward = calculateReviewBonusReward(row.bookingTotal)

    if (reward <= 0) {
      return null
    }

    return applyBalanceChange(row.guestId, reward, 'review_reward', {
      bookingId: row.review.bookingId,
      reviewId,
    })
  },
}
