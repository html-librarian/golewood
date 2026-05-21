import { GOLEWOOD_BOT_USER_ID } from '#shared/constants/golewood-bot'
import { eq } from 'drizzle-orm'
import { conversations, messages } from '../db/schema'
import { getDb } from '../utils/db'
import { notificationService } from './notification.service'

export const messagingBotService = {
  post: async (conversationId: string, body: string) => {
    const db = getDb()
    const now = new Date()

    const [row] = await db.insert(messages).values({
      conversationId,
      senderId: GOLEWOOD_BOT_USER_ID,
      body,
      isSystem: true,
    }).returning()

    await db.update(conversations)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(conversations.id, conversationId))

    return row
  },

  notifyConversationStarted: async ({
    conversationId,
    hostId,
    listingTitle,
    guestName,
  }: {
    conversationId: string
    hostId: string
    listingTitle: string
    guestName: string | null
  }) => {
    const guestLabel = guestName?.trim() || 'Гость'

    await messagingBotService.post(
      conversationId,
      `Гость ${guestLabel} начал диалог по объявлению «${listingTitle}». Ответьте в этом чате, когда будете готовы.`,
    )

    notificationService.notifyConversationStarted({
      hostId,
      listingTitle,
      guestName: guestLabel,
    })
  },

  notifyGuestMessage: async ({
    conversationId,
    hostId,
    listingTitle,
    guestName,
    preview,
  }: {
    conversationId: string
    hostId: string
    listingTitle: string
    guestName: string | null
    preview: string
  }) => {
    const guestLabel = guestName?.trim() || 'Гость'
    const snippet = preview.length > 120 ? `${preview.slice(0, 117)}…` : preview

    await messagingBotService.post(
      conversationId,
      `Новое сообщение от ${guestLabel} по «${listingTitle}»: «${snippet}»`,
    )

    notificationService.notifyMessageReceived({
      recipientId: hostId,
      listingTitle,
      preview,
      recipientRole: 'host',
    })
  },
}
