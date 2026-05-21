import type { MaxLinkStart, MaxLinkStatus, MaxOutgoingMessage, MaxUpdate } from '#shared/types/max'
import {
  buildMaxBookingStartapp,
  buildMaxBotDeepLink,
  buildMaxLinkStartParam,
  buildMaxMiniAppUrl,
  parseMaxBotStart,
} from '#shared/utils/max-links'
import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../utils/db'
import { forbidInProduction } from '../utils/dev-guards'
import { getRedis } from '../utils/redis'

const MAX_API_BASE = 'https://platform-api.max.ru'
const LINK_TTL_SEC = 900
const LINK_CODE_PREFIX = 'GW-'

const linkRedisKey = (code: string) => `max:link:${code}`
const normalizeLinkCode = (raw: string) => {
  const trimmed = raw.trim().toUpperCase()
  const withoutPrefix = trimmed.replace(/^GW[-_]?/, '')
  return withoutPrefix.replace(/[^A-Z0-9]/g, '')
}

const getMaxConfig = () => {
  const config = useRuntimeConfig()

  return {
    botToken: (config.maxBotToken as string)?.trim() ?? '',
    webhookSecret: (config.maxWebhookSecret as string)?.trim() ?? '',
    notificationsEnabled: Boolean(config.maxNotificationsEnabled),
    botUsername: (config.public.maxBotUsername as string)?.trim() ?? '',
    siteUrl: (config.public.siteUrl as string)?.replace(/\/$/, '') ?? '',
  }
}

const isApiEnabled = () => {
  const { botToken, notificationsEnabled } = getMaxConfig()
  return Boolean(botToken && notificationsEnabled)
}

const apiFetch = async <T>(path: string, init?: RequestInit) => {
  const { botToken } = getMaxConfig()

  if (!botToken) {
    throw createError({ statusCode: 503, statusMessage: 'MAX bot is not configured' })
  }

  const response = await fetch(`${MAX_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: botToken,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw createError({
      statusCode: 502,
      statusMessage: `MAX API error: ${response.status} ${body}`.slice(0, 200),
    })
  }

  if (response.status === 204) {
    return null as T
  }

  return await response.json() as T
}

export const maxService = {
  isEnabled: isApiEnabled,

  getStatus: async (userId: string): Promise<MaxLinkStatus> => {
    const config = getMaxConfig()
    const db = getDb()
    const [row] = await db.select({
      maxUserId: users.maxUserId,
      maxLinkedAt: users.maxLinkedAt,
    }).from(users).where(eq(users.id, userId)).limit(1)

    return {
      linked: Boolean(row?.maxUserId),
      maxUserId: row?.maxUserId ?? null,
      linkedAt: row?.maxLinkedAt?.toISOString() ?? null,
      botUsername: config.botUsername || null,
      enabled: isApiEnabled(),
    }
  },

  createLinkCode: async (userId: string): Promise<MaxLinkStart> => {
    const config = getMaxConfig()
    const code = randomBytes(4).toString('hex').toUpperCase()
    const displayCode = `${LINK_CODE_PREFIX}${code}`
    const redis = getRedis()

    await redis.set(linkRedisKey(code), userId, 'EX', LINK_TTL_SEC)

    const botUrl = config.botUsername
      ? buildMaxBotDeepLink(config.botUsername, buildMaxLinkStartParam(code))
      : null

    return {
      code: displayCode,
      botUrl,
      expiresIn: LINK_TTL_SEC,
      instructions: botUrl
        ? `Откройте бота в MAX по ссылке — код подставится автоматически (${displayCode})`
        : `Отправьте боту Golewood код ${displayCode}`,
    }
  },

  unlink: async (userId: string) => {
    const db = getDb()

    await db.update(users)
      .set({
        maxUserId: null,
        maxLinkedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
  },

  /** Dev-only: bind without real MAX API. */
  mockLink: async (userId: string, maxUserId = 9_000_000_001) => {
    forbidInProduction()

    const db = getDb()

    await db.update(users)
      .set({
        maxUserId,
        maxLinkedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    return { maxUserId }
  },

  bindMaxUser: async (code: string, maxUserId: number) => {
    const normalized = normalizeLinkCode(code)

    if (!normalized) {
      return { ok: false as const, reason: 'invalid_code' }
    }

    const redis = getRedis()
    const userId = await redis.get(linkRedisKey(normalized))

    if (!userId) {
      return { ok: false as const, reason: 'expired_code' }
    }

    const db = getDb()
    const [existing] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.maxUserId, maxUserId))
      .limit(1)

    if (existing && existing.id !== userId) {
      return { ok: false as const, reason: 'max_already_linked' }
    }

    await db.update(users)
      .set({
        maxUserId,
        maxLinkedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    await redis.del(linkRedisKey(normalized))

    return { ok: true as const, userId }
  },

  sendToUser: async (maxUserId: number, message: string | MaxOutgoingMessage) => {
    const body: MaxOutgoingMessage = typeof message === 'string'
      ? { text: message, notify: true }
      : { notify: true, ...message }

    if (!isApiEnabled()) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[max] ${maxUserId}:`, body.text, body.attachments?.length ? '[keyboard]' : '')
      }

      return { sent: false, provider: 'console' as const }
    }

    await apiFetch(`/messages?user_id=${maxUserId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return { sent: true, provider: 'max' as const }
  },

  sendGuestNotification: async (
    guestUserId: string,
    text: string,
    options?: { bookingId?: string },
  ) => {
    const db = getDb()
    const [row] = await db.select({ maxUserId: users.maxUserId })
      .from(users)
      .where(eq(users.id, guestUserId))
      .limit(1)

    if (!row?.maxUserId) {
      return { sent: false, provider: 'none' as const }
    }

    const config = getMaxConfig()
    const attachments = options?.bookingId && config.siteUrl
      ? [{
          type: 'inline_keyboard' as const,
          payload: {
            buttons: [
              [{
                type: 'link' as const,
                text: 'Открыть в MAX',
                url: buildMaxMiniAppUrl(config.siteUrl, buildMaxBookingStartapp(options.bookingId)),
              }],
              [{
                type: 'link' as const,
                text: 'На сайте',
                url: `${config.siteUrl}/bookings/${options.bookingId}`,
              }],
            ],
          },
        }]
      : undefined

    return await maxService.sendToUser(row.maxUserId, {
      text,
      notify: true,
      attachments,
    })
  },

  sendHostNotification: async (
    hostUserId: string,
    text: string,
    options?: { bookingId?: string },
  ) => {
    const db = getDb()
    const [row] = await db.select({ maxUserId: users.maxUserId })
      .from(users)
      .where(eq(users.id, hostUserId))
      .limit(1)

    if (!row?.maxUserId) {
      return { sent: false, provider: 'none' as const }
    }

    const config = getMaxConfig()
    const attachments = options?.bookingId && config.siteUrl
      ? [{
          type: 'inline_keyboard' as const,
          payload: {
            buttons: [
              [{
                type: 'link' as const,
                text: 'Открыть бронь',
                url: buildMaxMiniAppUrl(config.siteUrl, buildMaxBookingStartapp(options.bookingId)),
              }],
              [{
                type: 'link' as const,
                text: 'На сайте',
                url: `${config.siteUrl}/host/bookings`,
              }],
            ],
          },
        }]
      : undefined

    return await maxService.sendToUser(row.maxUserId, {
      text,
      notify: true,
      attachments,
    })
  },

  replyInChat: async (chatId: number, text: string) => {
    if (!getMaxConfig().botToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[max chat ${chatId}] ${text}`)
      }

      return
    }

    await apiFetch(`/messages?chat_id=${chatId}`, {
      method: 'POST',
      body: JSON.stringify({ text, notify: true }),
    }).catch(() => undefined)
  },

  extractLinkCode: (update: MaxUpdate) => {
    if (update.payload) {
      const intent = parseMaxBotStart(update.payload)

      if (intent.kind === 'link') {
        return normalizeLinkCode(intent.code)
      }
    }

    const payloadCode = update.payload ? normalizeLinkCode(update.payload) : ''

    if (payloadCode) {
      return payloadCode
    }

    const text = update.message?.body?.text?.trim() ?? ''
    const match = text.match(/GW[-_]?([A-Z0-9]{6,12})/i)

    if (match?.[1]) {
      return normalizeLinkCode(match[1])
    }

    if (/^[A-Z0-9]{6,12}$/i.test(text.replace(/^GW[-_]?/i, ''))) {
      return normalizeLinkCode(text)
    }

    return ''
  },

  handleUpdate: async (update: MaxUpdate) => {
    const maxUserId = update.user?.user_id ?? update.message?.sender?.user_id

    if (!maxUserId || update.user?.is_bot || update.message?.sender?.is_bot) {
      return
    }

    const chatId = update.chat_id

    if (update.update_type === 'bot_stopped') {
      const db = getDb()
      await db.update(users)
        .set({ maxUserId: null, maxLinkedAt: null, updatedAt: new Date() })
        .where(eq(users.maxUserId, maxUserId))

      return
    }

    const code = maxService.extractLinkCode(update)

    if (code) {
      const result = await maxService.bindMaxUser(code, maxUserId)

      if (chatId) {
        if (result.ok) {
          await maxService.replyInChat(
            chatId,
            'Уведомления Golewood подключены. Вы будете получать сообщения о бронях и чатах с гостями.',
          )
        } else if (result.reason === 'expired_code') {
          await maxService.replyInChat(
            chatId,
            'Код устарел. Откройте личный кабинет на Golewood и получите новый код привязки.',
          )
        } else if (result.reason === 'max_already_linked') {
          await maxService.replyInChat(
            chatId,
            'Этот аккаунт MAX уже привязан к другому пользователю Golewood.',
          )
        }
      }

      return
    }

    if (update.update_type === 'bot_started' && chatId) {
      const config = getMaxConfig()
      const startRaw = update.payload?.trim() ?? ''

      if (startRaw) {
        const intent = parseMaxBotStart(startRaw)

        if (intent.kind === 'link') {
          const result = await maxService.bindMaxUser(intent.code, maxUserId)

          if (result.ok) {
            await maxService.replyInChat(
              chatId,
              'Уведомления Golewood подключены. Вы будете получать сообщения о бронях и чатах с гостями.',
            )
          } else if (result.reason === 'expired_code') {
            await maxService.replyInChat(
              chatId,
              'Код устарел. Получите новый код привязки в личном кабинете на сайте.',
            )
          } else if (result.reason === 'max_already_linked') {
            await maxService.replyInChat(
              chatId,
              'Этот аккаунт MAX уже привязан к другому пользователю Golewood.',
            )
          } else {
            await maxService.replyInChat(
              chatId,
              'Не удалось привязать аккаунт. Отправьте код GW-XXXXXXXX из личного кабинета.',
            )
          }

          return
        }

        if (intent.kind === 'bookings' && config.siteUrl) {
          await maxService.replyInChat(
            chatId,
            `Бронирования хоста: ${buildMaxMiniAppUrl(config.siteUrl, 'bookings')}`,
          )
          return
        }

        if (intent.kind === 'booking' && config.siteUrl) {
          await maxService.replyInChat(
            chatId,
            `Открыть бронь: ${buildMaxMiniAppUrl(config.siteUrl, buildMaxBookingStartapp(intent.bookingId))}`,
          )
          return
        }
      }

      const welcomeBotUrl = config.botUsername && config.siteUrl
        ? buildMaxBotDeepLink(config.botUsername, 'bookings')
        : null

      await maxService.replyInChat(
        chatId,
        welcomeBotUrl
          ? `Здравствуйте! Привяжите MAX в кабинете на сайте (код GW-*) или откройте брони: ${welcomeBotUrl}`
          : 'Здравствуйте! Чтобы получать уведомления Golewood, откройте кабинет хоста на сайте и отправьте сюда код привязки (формат GW-XXXXXXXX).',
      )
    }
  },

  verifyWebhookSecret: (header: string | undefined) => {
    const { webhookSecret } = getMaxConfig()

    if (!webhookSecret) {
      return process.env.NODE_ENV !== 'production'
    }

    return header === webhookSecret
  },
}
