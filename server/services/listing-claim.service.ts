import type { ListingClaimAttachment, ListingClaimRequest } from '#shared/types/listing-claim'
import type { CreateListingClaimInput } from '#shared/schemas/listing-claim'
import {
  LISTING_CLAIM_ATTACHMENT_MAX_BYTES,
  LISTING_CLAIM_ATTACHMENT_MAX_COUNT,
} from '#shared/utils/media-limits'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { listingClaimAttachments, listingClaimRequests, listings, users } from '../db/schema'
import { getDb } from '../utils/db'
import { saveClaimAttachment } from '../utils/storage'
import { normalizeEmail } from '#shared/utils/email'
import { normalizePhone } from '#shared/utils/phone'
import {
  normalizeSourceAttribution,
  teamListingSourceAttributionError,
} from '#shared/utils/listing-source-attribution'
import { emailService } from './email.service'

export type ClaimUploadFile = { data: Buffer, filename?: string, type?: string }

const mapAttachment = (row: typeof listingClaimAttachments.$inferSelect): ListingClaimAttachment => ({
  id: row.id,
  fileName: row.fileName,
  fileUrl: row.fileUrl,
  mimeType: row.mimeType,
  byteSize: row.byteSize,
})

const mapClaim = (
  row: typeof listingClaimRequests.$inferSelect,
  listingTitle: string,
  attachments: ListingClaimAttachment[],
): ListingClaimRequest => ({
  id: row.id,
  listingId: row.listingId,
  listingTitle,
  requesterName: row.requesterName,
  requesterPhone: row.requesterPhone,
  requesterEmail: row.requesterEmail,
  message: row.message,
  attachments,
  status: row.status,
  assignedHostId: row.assignedHostId,
  createdAt: row.createdAt.toISOString(),
  resolvedAt: row.resolvedAt?.toISOString() ?? null,
})

const loadAttachmentsByClaimIds = async (claimIds: string[]): Promise<Record<string, ListingClaimAttachment[]>> => {
  if (!claimIds.length) {
    return {}
  }

  const db = getDb()
  const rows = await db.select()
    .from(listingClaimAttachments)
    .where(inArray(listingClaimAttachments.claimId, claimIds))
    .orderBy(asc(listingClaimAttachments.sortOrder), asc(listingClaimAttachments.createdAt))

  const grouped: Record<string, ListingClaimAttachment[]> = {}

  for (const row of rows) {
    const list = grouped[row.claimId] ?? []
    list.push(mapAttachment(row))
    grouped[row.claimId] = list
  }

  return grouped
}

const saveClaimAttachments = async (claimId: string, files: ClaimUploadFile[]) => {
  if (!files.length) {
    return []
  }

  if (files.length > LISTING_CLAIM_ATTACHMENT_MAX_COUNT) {
    throw createError({
      statusCode: 400,
      statusMessage: `At most ${LISTING_CLAIM_ATTACHMENT_MAX_COUNT} files allowed`,
    })
  }

  const db = getDb()
  const saved: ListingClaimAttachment[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]!

    if (file.data.length > LISTING_CLAIM_ATTACHMENT_MAX_BYTES) {
      throw createError({ statusCode: 400, statusMessage: 'Attachment is too large' })
    }

    const fileUrl = await saveClaimAttachment(claimId, file)
    const [row] = await db.insert(listingClaimAttachments).values({
      claimId,
      fileName: file.filename ?? 'attachment',
      fileUrl,
      mimeType: file.type ?? null,
      byteSize: file.data.length,
      sortOrder: index,
    }).returning()

    saved.push(mapAttachment(row))
  }

  return saved
}

const notifyAdminsNewClaim = async (
  claim: typeof listingClaimRequests.$inferSelect,
  listingTitle: string,
  attachmentCount: number,
) => {
  const db = getDb()
  const config = useRuntimeConfig()
  const adminRows = await db.select({ email: users.email })
    .from(users)
    .where(and(eq(users.role, 'admin'), sql`${users.email} is not null`))

  const adminUrl = `${config.public.siteUrl.replace(/\/$/, '')}/admin/listings`
  const text = [
    `Новая заявка на объект «${listingTitle}».`,
    `Имя: ${claim.requesterName}`,
    `Телефон: ${claim.requesterPhone}`,
    claim.requesterEmail ? `Email: ${claim.requesterEmail}` : null,
    claim.message ? `Комментарий: ${claim.message}` : null,
    attachmentCount > 0 ? `Вложений: ${attachmentCount}` : null,
    `Админка: ${adminUrl}`,
  ].filter(Boolean).join('\n')

  await Promise.all(adminRows.map(async (row) => {
    if (!row.email) {
      return
    }

    await emailService.send({
      to: row.email,
      subject: `Заявка владельца — ${listingTitle}`,
      text,
    }).catch(() => undefined)
  }))
}

const notifyRequesterResolved = async (
  claim: typeof listingClaimRequests.$inferSelect,
  listingTitle: string,
  approved: boolean,
) => {
  if (!claim.requesterEmail) {
    return
  }

  const config = useRuntimeConfig()
  const listingUrl = `${config.public.siteUrl.replace(/\/$/, '')}/listings/${claim.listingId}`

  await emailService.send({
    to: claim.requesterEmail,
    subject: approved
      ? `Доступ к «${listingTitle}» передан — Golewood`
      : `Заявка на «${listingTitle}» — Golewood`,
    text: approved
      ? `Мы передали вам управление объектом «${listingTitle}». Войдите в личный кабинет хоста: ${listingUrl}`
      : `К сожалению, заявка на объект «${listingTitle}» отклонена. Напишите в поддержку, если это ошибка.`,
  }).catch(() => undefined)
}

const ensureHostFromClaim = async (claim: typeof listingClaimRequests.$inferSelect) => {
  const db = getDb()
  const phone = normalizePhone(claim.requesterPhone)
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1)

  if (existing) {
    if (existing.role === 'guest') {
      const [updated] = await db.update(users)
        .set({ role: 'host', updatedAt: new Date() })
        .where(eq(users.id, existing.id))
        .returning()

      return updated
    }

    return existing
  }

  const email = claim.requesterEmail ? normalizeEmail(claim.requesterEmail) : null

  if (email) {
    const [byEmail] = await db.select().from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1)

    if (byEmail) {
      if (byEmail.role === 'guest') {
        const [updated] = await db.update(users)
          .set({ role: 'host', updatedAt: new Date() })
          .where(eq(users.id, byEmail.id))
          .returning()

        return updated
      }

      return byEmail
    }
  }

  const [created] = await db.insert(users).values({
    phone,
    email,
    name: claim.requesterName,
    role: 'host',
  }).returning()

  return created
}

export const listingClaimService = {
  create: async (listingId: string, input: CreateListingClaimInput, files: ClaimUploadFile[] = []) => {
    const db = getDb()
    const [listing] = await db.select({
      id: listings.id,
      managedByTeam: listings.managedByTeam,
      status: listings.status,
    })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1)

    if (!listing || listing.status !== 'published' || !listing.managedByTeam) {
      throw createError({ statusCode: 400, statusMessage: 'This listing is not available for ownership claims' })
    }

    const [pending] = await db.select({ id: listingClaimRequests.id })
      .from(listingClaimRequests)
      .where(and(
        eq(listingClaimRequests.listingId, listingId),
        eq(listingClaimRequests.requesterPhone, input.phone),
        eq(listingClaimRequests.status, 'pending'),
      ))
      .limit(1)

    if (pending) {
      throw createError({ statusCode: 409, statusMessage: 'You already have a pending request for this listing' })
    }

    const [row] = await db.insert(listingClaimRequests).values({
      listingId,
      requesterName: input.name,
      requesterPhone: input.phone,
      requesterEmail: input.email?.trim() || null,
      message: input.message?.trim() || null,
    }).returning()

    const attachments = await saveClaimAttachments(row.id, files)

    const [listingRow] = await db.select({ title: listings.title })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1)

    const listingTitle = listingRow?.title ?? ''
    await notifyAdminsNewClaim(row, listingTitle, attachments.length)

    return mapClaim(row, listingTitle, attachments)
  },

  listPending: async (): Promise<ListingClaimRequest[]> => {
    const db = getDb()
    const rows = await db.select({
      claim: listingClaimRequests,
      listingTitle: listings.title,
    })
      .from(listingClaimRequests)
      .innerJoin(listings, eq(listingClaimRequests.listingId, listings.id))
      .where(eq(listingClaimRequests.status, 'pending'))
      .orderBy(desc(listingClaimRequests.createdAt))

    const attachmentsByClaim = await loadAttachmentsByClaimIds(rows.map(({ claim }) => claim.id))

    return rows.map(({ claim, listingTitle }) =>
      mapClaim(claim, listingTitle, attachmentsByClaim[claim.id] ?? []),
    )
  },

  approve: async (
    claimId: string,
    adminUserId: string,
    options: { hostUserId?: string, assignRequesterAsHost?: boolean },
  ) => {
    const db = getDb()
    const [claim] = await db.select()
      .from(listingClaimRequests)
      .where(eq(listingClaimRequests.id, claimId))
      .limit(1)

    if (!claim) {
      throw createError({ statusCode: 404, statusMessage: 'Claim request not found' })
    }

    if (claim.status !== 'pending') {
      throw createError({ statusCode: 400, statusMessage: 'Claim request is not pending' })
    }

    let hostUserId = options.hostUserId

    if (options.assignRequesterAsHost) {
      const hostRow = await ensureHostFromClaim(claim)
      hostUserId = hostRow.id
    }

    if (!hostUserId) {
      throw createError({ statusCode: 400, statusMessage: 'Host user is required' })
    }

    const [host] = await db.select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, hostUserId))
      .limit(1)

    if (!host || (host.role !== 'host' && host.role !== 'admin')) {
      throw createError({ statusCode: 400, statusMessage: 'Target user must be a host' })
    }

    await db.update(listings)
      .set({
        hostId: hostUserId,
        managedByTeam: false,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, claim.listingId))

    const [updated] = await db.update(listingClaimRequests)
      .set({
        status: 'approved',
        assignedHostId: hostUserId,
        resolvedBy: adminUserId,
        resolvedAt: new Date(),
      })
      .where(eq(listingClaimRequests.id, claimId))
      .returning()

    const [listingRow] = await db.select({ title: listings.title })
      .from(listings)
      .where(eq(listings.id, claim.listingId))
      .limit(1)

    const listingTitle = listingRow?.title ?? ''
    await notifyRequesterResolved(claim, listingTitle, true)

    const attachmentsByClaim = await loadAttachmentsByClaimIds([claimId])

    return mapClaim(updated, listingTitle, attachmentsByClaim[claimId] ?? [])
  },

  reject: async (claimId: string, adminUserId: string) => {
    const db = getDb()
    const [claim] = await db.select()
      .from(listingClaimRequests)
      .where(eq(listingClaimRequests.id, claimId))
      .limit(1)

    if (!claim) {
      throw createError({ statusCode: 404, statusMessage: 'Claim request not found' })
    }

    if (claim.status !== 'pending') {
      throw createError({ statusCode: 400, statusMessage: 'Claim request is not pending' })
    }

    const [updated] = await db.update(listingClaimRequests)
      .set({
        status: 'rejected',
        resolvedBy: adminUserId,
        resolvedAt: new Date(),
      })
      .where(eq(listingClaimRequests.id, claimId))
      .returning()

    const [listingRow] = await db.select({ title: listings.title })
      .from(listings)
      .where(eq(listings.id, claim.listingId))
      .limit(1)

    const listingTitle = listingRow?.title ?? ''
    await notifyRequesterResolved(claim, listingTitle, false)

    const attachmentsByClaim = await loadAttachmentsByClaimIds([claimId])

    return mapClaim(updated, listingTitle, attachmentsByClaim[claimId] ?? [])
  },

  updateListingOwnership: async (
    listingId: string,
    input: {
      managedByTeam?: boolean
      hostId?: string
      sourceAttributionRu?: string | null
      sourceAttributionEn?: string | null
    },
  ) => {
    const db = getDb()
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    const nextManagedByTeam = input.managedByTeam ?? listing.managedByTeam
    const nextSourceRu = input.sourceAttributionRu !== undefined
      ? input.sourceAttributionRu
      : listing.sourceAttributionRu
    const attributionError = teamListingSourceAttributionError(nextManagedByTeam, nextSourceRu)

    if (attributionError) {
      throw createError({ statusCode: 400, statusMessage: attributionError })
    }

    const patch: Partial<typeof listings.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.managedByTeam !== undefined) {
      patch.managedByTeam = input.managedByTeam
    }

    if (input.sourceAttributionRu !== undefined) {
      patch.sourceAttributionRu = normalizeSourceAttribution(input.sourceAttributionRu)
    }

    if (input.sourceAttributionEn !== undefined) {
      patch.sourceAttributionEn = normalizeSourceAttribution(input.sourceAttributionEn)
    }

    if (input.hostId) {
      const [host] = await db.select({ role: users.role }).from(users).where(eq(users.id, input.hostId)).limit(1)

      if (!host || (host.role !== 'host' && host.role !== 'admin')) {
        throw createError({ statusCode: 400, statusMessage: 'Target user must be a host' })
      }

      patch.hostId = input.hostId
    }

    const [row] = await db.update(listings)
      .set(patch)
      .where(eq(listings.id, listingId))
      .returning()

    return row
  },
}
