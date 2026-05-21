import type { HostLegalProfileAdmin, HostLegalDetails, HostVerificationPublic } from '#shared/types/host-verification'
import { HOST_VERIFICATION_BADGE_LABELS } from '#shared/types/host-verification'
import type { UpsertHostVerificationInput } from '#shared/schemas/host-verification'
import { eq } from 'drizzle-orm'
import { hostLegalProfiles, users } from '../db/schema'
import { getDb } from '../utils/db'

const mapLegalDetails = (row: typeof hostLegalProfiles.$inferSelect): HostLegalDetails => ({
  legalType: row.legalType,
  legalName: row.legalName,
  inn: row.inn,
  ogrn: row.ogrn,
  legalAddress: row.legalAddress,
  workingHoursNote: row.workingHoursNote,
})

const mapPublic = (row: typeof hostLegalProfiles.$inferSelect | undefined): HostVerificationPublic => {
  if (!row?.isVerified || !row.legalName.trim()) {
    return {
      isVerified: false,
      badgeLabel: HOST_VERIFICATION_BADGE_LABELS.company,
      legal: null,
    }
  }

  return {
    isVerified: true,
    badgeLabel: HOST_VERIFICATION_BADGE_LABELS[row.legalType],
    legal: mapLegalDetails(row),
  }
}

export const hostVerificationService = {
  getPublicForHost: async (hostId: string): Promise<HostVerificationPublic> => {
    const db = getDb()
    const [row] = await db.select().from(hostLegalProfiles)
      .where(eq(hostLegalProfiles.userId, hostId))
      .limit(1)

    return mapPublic(row)
  },

  getAdminForUser: async (userId: string): Promise<HostLegalProfileAdmin | null> => {
    const db = getDb()
    const [row] = await db.select().from(hostLegalProfiles)
      .where(eq(hostLegalProfiles.userId, userId))
      .limit(1)

    if (!row) {
      return null
    }

    return {
      userId: row.userId,
      isVerified: row.isVerified,
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
      ...mapLegalDetails(row),
    }
  },

  upsertByAdmin: async (userId: string, input: UpsertHostVerificationInput): Promise<HostLegalProfileAdmin> => {
    const db = getDb()
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    if (user.role !== 'host' && user.role !== 'admin') {
      throw createError({ statusCode: 400, statusMessage: 'User is not a host' })
    }

    if (input.isVerified && (!input.legalName || !input.inn || !input.legalAddress)) {
      throw createError({ statusCode: 400, statusMessage: 'Legal details required for verified host' })
    }

    const now = new Date()
    const values = {
      isVerified: input.isVerified,
      legalType: input.legalType,
      legalName: input.legalName,
      inn: input.inn,
      ogrn: input.ogrn?.trim() || null,
      legalAddress: input.legalAddress,
      workingHoursNote: input.workingHoursNote ?? '',
      verifiedAt: input.isVerified ? now : null,
      updatedAt: now,
    }

    const [existing] = await db.select({ userId: hostLegalProfiles.userId })
      .from(hostLegalProfiles)
      .where(eq(hostLegalProfiles.userId, userId))
      .limit(1)

    const [row] = existing
      ? await db.update(hostLegalProfiles)
        .set(values)
        .where(eq(hostLegalProfiles.userId, userId))
        .returning()
      : await db.insert(hostLegalProfiles)
        .values({ userId, ...values })
        .returning()

    return {
      userId: row.userId,
      isVerified: row.isVerified,
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
      ...mapLegalDetails(row),
    }
  },
}
