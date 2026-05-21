import type { HostPayoutProfile } from '#shared/types/host-payout'
import type { AdminHostPayoutDecisionInput, UpsertHostPayoutProfileInput } from '#shared/schemas/host-payout'
import { desc, eq } from 'drizzle-orm'
import { hostPayoutProfiles, users } from '../db/schema'
import { getDb } from '../utils/db'
import { allowMarketplacePayoutMock } from '../utils/dev-guards'

const mapProfile = (row: typeof hostPayoutProfiles.$inferSelect): HostPayoutProfile => ({
  userId: row.userId,
  status: row.status,
  inn: row.inn,
  bankAccount: row.bankAccount,
  bik: row.bik,
  yookassaRecipientId: row.yookassaRecipientId,
  rejectionReason: row.rejectionReason,
  submittedAt: row.submittedAt?.toISOString() ?? null,
  activatedAt: row.activatedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const emptyProfile = (userId: string): HostPayoutProfile => ({
  userId,
  status: 'not_started',
  inn: null,
  bankAccount: null,
  bik: null,
  yookassaRecipientId: null,
  rejectionReason: null,
  submittedAt: null,
  activatedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const hostPayoutService = {
  getForUser: async (userId: string): Promise<HostPayoutProfile> => {
    const db = getDb()
    const [row] = await db.select().from(hostPayoutProfiles)
      .where(eq(hostPayoutProfiles.userId, userId))
      .limit(1)

    return row ? mapProfile(row) : emptyProfile(userId)
  },

  isReadyForBookingPayments: async (hostId: string) => {
    const profile = await hostPayoutService.getForUser(hostId)
    return profile.status === 'active' && Boolean(profile.yookassaRecipientId)
  },

  submitForReview: async (userId: string, input: UpsertHostPayoutProfileInput) => {
    const db = getDb()
    const now = new Date()
    const config = useRuntimeConfig()
    const autoActivate = allowMarketplacePayoutMock(String(config.yookassaMarketplaceMock) === 'true')

    const [row] = await db.insert(hostPayoutProfiles).values({
      userId,
      inn: input.inn,
      bankAccount: input.bankAccount,
      bik: input.bik,
      status: autoActivate ? 'active' : 'pending',
      yookassaRecipientId: autoActivate ? `mock-recipient-${userId}` : null,
      submittedAt: now,
      activatedAt: autoActivate ? now : null,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: hostPayoutProfiles.userId,
      set: {
        inn: input.inn,
        bankAccount: input.bankAccount,
        bik: input.bik,
        status: autoActivate ? 'active' : 'pending',
        yookassaRecipientId: autoActivate ? `mock-recipient-${userId}` : null,
        rejectionReason: null,
        submittedAt: now,
        activatedAt: autoActivate ? now : null,
        updatedAt: now,
      },
    }).returning()

    return mapProfile(row)
  },

  listPendingForAdmin: async () => {
    const db = getDb()
    const rows = await db.select({
      profile: hostPayoutProfiles,
      userName: users.name,
      userPhone: users.phone,
    })
      .from(hostPayoutProfiles)
      .innerJoin(users, eq(hostPayoutProfiles.userId, users.id))
      .where(eq(hostPayoutProfiles.status, 'pending'))
      .orderBy(desc(hostPayoutProfiles.submittedAt))

    return rows.map(({ profile, userName, userPhone }) => ({
      ...mapProfile(profile),
      userName,
      userPhone,
    }))
  },

  decideByAdmin: async (userId: string, input: AdminHostPayoutDecisionInput) => {
    const db = getDb()
    const now = new Date()
    const [existing] = await db.select().from(hostPayoutProfiles)
      .where(eq(hostPayoutProfiles.userId, userId))
      .limit(1)

    if (!existing || existing.status !== 'pending') {
      throw createError({ statusCode: 404, statusMessage: 'Pending payout profile not found' })
    }

    if (input.status === 'rejected') {
      const [row] = await db.update(hostPayoutProfiles)
        .set({
          status: 'rejected',
          rejectionReason: input.rejectionReason ?? null,
          updatedAt: now,
        })
        .where(eq(hostPayoutProfiles.userId, userId))
        .returning()

      return mapProfile(row)
    }

    const [row] = await db.update(hostPayoutProfiles)
      .set({
        status: 'active',
        yookassaRecipientId: input.yookassaRecipientId!,
        rejectionReason: null,
        activatedAt: now,
        updatedAt: now,
      })
      .where(eq(hostPayoutProfiles.userId, userId))
      .returning()

    return mapProfile(row)
  },
}
