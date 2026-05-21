import type { SupportRequest } from '#shared/types/support-request'
import type { SupportContactInput } from '#shared/schemas/support'
import { desc, eq, inArray } from 'drizzle-orm'
import { supportRequests } from '../db/schema'
import { getDb } from '../utils/db'

const mapRow = (row: typeof supportRequests.$inferSelect): SupportRequest => ({
  id: row.id,
  name: row.name,
  email: row.email,
  contextUrl: row.contextUrl,
  message: row.message,
  status: row.status,
  staffNote: row.staffNote,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const supportRequestService = {
  createFromContact: async (input: SupportContactInput): Promise<SupportRequest> => {
    const db = getDb()
    const [row] = await db.insert(supportRequests).values({
      name: input.name,
      email: input.email,
      contextUrl: input.contextUrl ?? null,
      message: input.message,
    }).returning()

    return mapRow(row)
  },

  listOpen: async (): Promise<SupportRequest[]> => {
    const db = getDb()
    const rows = await db.select().from(supportRequests)
      .where(inArray(supportRequests.status, ['open', 'in_progress']))
      .orderBy(desc(supportRequests.createdAt))

    return rows.map(mapRow)
  },

  updateStatus: async (
    id: string,
    status: 'in_progress' | 'resolved' | 'dismissed',
    staffNote?: string,
  ): Promise<SupportRequest> => {
    const db = getDb()
    const [row] = await db.update(supportRequests)
      .set({
        status,
        staffNote: staffNote ?? '',
        updatedAt: new Date(),
      })
      .where(eq(supportRequests.id, id))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Support request not found' })
    }

    return mapRow(row)
  },
}
