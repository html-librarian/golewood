import type { Report, ReportWithDetails } from '#shared/types/report'
import type { CreateReportInput } from '#shared/schemas/admin'
import { desc, eq, inArray } from 'drizzle-orm'
import { reports, users } from '../db/schema'
import { getDb } from '../utils/db'

const mapReport = (row: typeof reports.$inferSelect): Report => ({
  id: row.id,
  reporterId: row.reporterId,
  type: row.type,
  listingId: row.listingId,
  bookingId: row.bookingId,
  targetUserId: row.targetUserId,
  reason: row.reason,
  status: row.status,
  adminNote: row.adminNote,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const reportService = {
  create: async (reporterId: string, input: CreateReportInput): Promise<Report> => {
    const db = getDb()
    const [row] = await db.insert(reports).values({
      reporterId,
      type: input.type,
      listingId: input.listingId ?? null,
      bookingId: input.bookingId ?? null,
      targetUserId: input.targetUserId ?? null,
      reason: input.reason,
    }).returning()

    return mapReport(row)
  },

  listForAdmin: async (): Promise<ReportWithDetails[]> => {
    const db = getDb()
    const rows = await db.select({
      report: reports,
      reporterName: users.name,
      reporterPhone: users.phone,
    })
      .from(reports)
      .innerJoin(users, eq(reports.reporterId, users.id))
      .where(inArray(reports.status, ['open', 'in_progress']))
      .orderBy(desc(reports.createdAt))

    return rows.map(({ report, reporterName, reporterPhone }) => ({
      ...mapReport(report),
      reporterName,
      reporterPhone,
    }))
  },

  updateStatus: async (
    reportId: string,
    status: 'in_progress' | 'resolved' | 'dismissed',
    adminNote?: string,
  ): Promise<Report> => {
    const db = getDb()
    const [row] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Report not found' })
    }

    if (!['open', 'in_progress'].includes(row.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Report is already closed' })
    }

    const [updated] = await db.update(reports)
      .set({
        status,
        adminNote: adminNote ?? row.adminNote,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))
      .returning()

    return mapReport(updated)
  },
}
