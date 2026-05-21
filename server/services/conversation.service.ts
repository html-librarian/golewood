import type { ConversationDetail, ConversationSummary, Message } from '#shared/types/conversation'
import type { SendMessageInput, StartConversationInput } from '#shared/schemas/conversation'
import { GOLEWOOD_BOT_USER_ID } from '#shared/constants/golewood-bot'
import { and, desc, eq, gt, ne, or, sql } from 'drizzle-orm'
import { conversations, listings, messages, users } from '../db/schema'
import { getDb } from '../utils/db'
import { messagingBotService } from './messaging-bot.service'
import { notificationService } from './notification.service'

const mapMessage = (row: typeof messages.$inferSelect): Message => ({
  id: row.id,
  conversationId: row.conversationId,
  senderId: row.senderId,
  body: row.body,
  isSystem: row.isSystem,
  createdAt: row.createdAt.toISOString(),
})

const mapParticipant = (row: typeof users.$inferSelect) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
})

const getLastMessage = async (conversationId: string): Promise<Message | null> => {
  const db = getDb()
  const [userRow] = await db.select()
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.isSystem, false)))
    .orderBy(desc(messages.createdAt))
    .limit(1)

  if (userRow) {
    return mapMessage(userRow)
  }

  const [anyRow] = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1)

  return anyRow ? mapMessage(anyRow) : null
}

const countUnread = async (
  conversation: typeof conversations.$inferSelect,
  userId: string,
): Promise<number> => {
  const db = getDb()
  const lastReadAt = userId === conversation.guestId
    ? conversation.guestLastReadAt
    : conversation.hostLastReadAt

  const isHost = userId === conversation.hostId

  const conditions = [
    eq(messages.conversationId, conversation.id),
    ne(messages.senderId, userId),
    isHost
      ? or(
          eq(messages.isSystem, false),
          and(eq(messages.isSystem, true), eq(messages.senderId, GOLEWOOD_BOT_USER_ID)),
        )
      : eq(messages.isSystem, false),
  ]

  if (lastReadAt) {
    conditions.push(gt(messages.createdAt, lastReadAt))
  }

  const [row] = await db.select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(...conditions))

  return row?.count ?? 0
}

const toSummary = async (
  row: typeof conversations.$inferSelect,
  listingTitle: string,
  guest: typeof users.$inferSelect,
  host: typeof users.$inferSelect,
  viewerId: string,
): Promise<ConversationSummary> => ({
  id: row.id,
  listingId: row.listingId,
  listingTitle,
  guest: mapParticipant(guest),
  host: mapParticipant(host),
  lastMessage: await getLastMessage(row.id),
  unreadCount: await countUnread(row, viewerId),
  updatedAt: (row.lastMessageAt ?? row.updatedAt).toISOString(),
})

const assertParticipant = (conversation: typeof conversations.$inferSelect, userId: string) => {
  if (conversation.guestId !== userId && conversation.hostId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

export const conversationService = {
  countUnreadTotal: async (userId: string): Promise<number> => {
    const db = getDb()
    const rows = await db.select()
      .from(conversations)
      .where(or(eq(conversations.guestId, userId), eq(conversations.hostId, userId)))

    let total = 0

    for (const row of rows) {
      total += await countUnread(row, userId)
    }

    return total
  },

  markAsRead: async (conversationId: string, userId: string) => {
    const db = getDb()
    const [conversation] = await db.select().from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!conversation) {
      return
    }

    assertParticipant(conversation, userId)

    const now = new Date()
    const patch = userId === conversation.guestId
      ? { guestLastReadAt: now }
      : { hostLastReadAt: now }

    await db.update(conversations)
      .set({ ...patch, updatedAt: conversation.updatedAt })
      .where(eq(conversations.id, conversationId))
  },

  listForUser: async (userId: string): Promise<ConversationSummary[]> => {
    const db = getDb()
    const rows = await db.select({
      conversation: conversations,
      listing: listings,
      guest: users,
    })
      .from(conversations)
      .innerJoin(listings, eq(conversations.listingId, listings.id))
      .innerJoin(users, eq(conversations.guestId, users.id))
      .where(or(eq(conversations.guestId, userId), eq(conversations.hostId, userId)))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt))

    const summaries: ConversationSummary[] = []

    for (const { conversation, listing, guest } of rows) {
      const [host] = await db.select().from(users).where(eq(users.id, conversation.hostId)).limit(1)

      if (!host) {
        continue
      }

      summaries.push(await toSummary(conversation, listing.title, guest, host, userId))
    }

    return summaries
  },

  getById: async (id: string, userId: string): Promise<ConversationDetail> => {
    const db = getDb()
    const [row] = await db.select({
      conversation: conversations,
      listing: listings,
      guest: users,
    })
      .from(conversations)
      .innerJoin(listings, eq(conversations.listingId, listings.id))
      .innerJoin(users, eq(conversations.guestId, users.id))
      .where(eq(conversations.id, id))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
    }

    assertParticipant(row.conversation, userId)

    const [host] = await db.select().from(users).where(eq(users.id, row.conversation.hostId)).limit(1)

    if (!host) {
      throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
    }

    const messageRows = await db.select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt)

    await conversationService.markAsRead(id, userId)

    const summary = await toSummary(row.conversation, row.listing.title, row.guest, host, userId)

    return {
      ...summary,
      unreadCount: 0,
      messages: messageRows.map(mapMessage),
    }
  },

  start: async (guestId: string, input: StartConversationInput): Promise<ConversationDetail> => {
    const db = getDb()
    const [listing] = await db.select().from(listings)
      .where(and(eq(listings.id, input.listingId), eq(listings.status, 'published')))
      .limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    if (listing.hostId === guestId) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot message yourself' })
    }

    const [existing] = await db.select().from(conversations)
      .where(and(eq(conversations.listingId, input.listingId), eq(conversations.guestId, guestId)))
      .limit(1)

    let conversation = existing
    const isNew = !conversation

    if (!conversation) {
      const [created] = await db.insert(conversations).values({
        listingId: input.listingId,
        guestId,
        hostId: listing.hostId,
      }).returning()

      conversation = created
    }

    const [guest] = await db.select({ name: users.name }).from(users).where(eq(users.id, guestId)).limit(1)

    if (isNew && !input.body?.trim()) {
      await messagingBotService.notifyConversationStarted({
        conversationId: conversation.id,
        hostId: listing.hostId,
        listingTitle: listing.title,
        guestName: guest?.name ?? null,
      })
    }

    if (input.body?.trim()) {
      await conversationService.sendMessage(conversation.id, guestId, { body: input.body.trim() })
    }

    return conversationService.getById(conversation.id, guestId)
  },

  sendMessage: async (conversationId: string, senderId: string, input: SendMessageInput): Promise<Message> => {
    const db = getDb()
    const [conversation] = await db.select().from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!conversation) {
      throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
    }

    assertParticipant(conversation, senderId)

    const [listing] = await db.select({ title: listings.title })
      .from(listings)
      .where(eq(listings.id, conversation.listingId))
      .limit(1)

    const now = new Date()
    const [row] = await db.insert(messages).values({
      conversationId,
      senderId,
      body: input.body,
    }).returning()

    const readPatch = senderId === conversation.guestId
      ? { guestLastReadAt: now }
      : { hostLastReadAt: now }

    await db.update(conversations)
      .set({ lastMessageAt: now, updatedAt: now, ...readPatch })
      .where(eq(conversations.id, conversationId))

    if (senderId === conversation.guestId) {
      const [guest] = await db.select({ name: users.name }).from(users).where(eq(users.id, senderId)).limit(1)

      await messagingBotService.notifyGuestMessage({
        conversationId,
        hostId: conversation.hostId,
        listingTitle: listing?.title ?? 'Listing',
        guestName: guest?.name ?? null,
        preview: input.body,
      })
    } else {
      notificationService.notifyMessageReceived({
        recipientId: conversation.guestId,
        listingTitle: listing?.title ?? 'Listing',
        preview: input.body,
        recipientRole: 'guest',
      })
    }

    return mapMessage(row)
  },
}
