import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../utils/db'
import { emailService } from './email.service'
import { maxService } from './max.service'
import { smsService } from './sms.service'

type BookingDates = {
  checkIn: string
  checkOut: string
}

const sendSafe = (promise: Promise<unknown>) => {
  promise.catch((error) => {
    console.error('[notification]', error)
  })
}

const getUserContact = async (userId: string) => {
  const db = getDb()
  const [row] = await db.select({ phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return row
}

const notifyUser = async ({
  userId,
  smsMessage,
  emailSubject,
  maxMessage,
  maxBookingId,
  maxAudience = 'host',
}: {
  userId: string
  smsMessage: string
  emailSubject: string
  maxMessage?: string
  maxBookingId?: string
  maxAudience?: 'host' | 'guest'
}) => {
  const contact = await getUserContact(userId)

  if (!contact) {
    return
  }

  await smsService.send({
    phone: contact.phone,
    message: smsMessage,
    channel: 'notification',
  })

  if (contact.email) {
    await emailService.send({
      to: contact.email,
      subject: emailSubject,
      text: smsMessage,
    })
  }

  if (maxMessage) {
    const sendMax = maxAudience === 'guest'
      ? maxService.sendGuestNotification(userId, maxMessage, { bookingId: maxBookingId })
      : maxService.sendHostNotification(userId, maxMessage, { bookingId: maxBookingId })

    await sendMax.catch(() => undefined)
  }
}

const notifyHost = async (hostId: string, smsMessage: string, emailSubject: string) => {
  await notifyUser({
    userId: hostId,
    smsMessage,
    emailSubject,
    maxMessage: smsMessage,
  })
}

const notificationCore = {
  bookingCreated: async ({
    hostId,
    bookingId,
    listingTitle,
    checkIn,
    checkOut,
  }: BookingDates & { hostId: string, bookingId: string, listingTitle: string }) => {
    const message = `Golewood: новая бронь «${listingTitle}» ${checkIn}–${checkOut}. Подтвердите в мини-приложении или на сайте.`

    const contact = await getUserContact(hostId)

    if (!contact) {
      return
    }

    await smsService.send({
      phone: contact.phone,
      message,
      channel: 'notification',
    })

    if (contact.email) {
      await emailService.send({
        to: contact.email,
        subject: 'Новая бронь на Golewood',
        text: message,
      })
    }

    await maxService.sendHostNotification(hostId, message, { bookingId }).catch(() => undefined)
  },

  bookingConfirmed: async ({
    guestId,
    bookingId,
    listingTitle,
    checkIn,
    checkOut,
  }: BookingDates & { guestId: string, bookingId: string, listingTitle: string }) => {
    const message = `Golewood: бронь «${listingTitle}» ${checkIn}–${checkOut} подтверждена.`

    await notifyUser({
      userId: guestId,
      smsMessage: message,
      emailSubject: 'Бронь подтверждена — Golewood',
      maxMessage: message,
      maxBookingId: bookingId,
      maxAudience: 'guest',
    })
  },

  bookingCancelled: async ({
    recipientId,
    bookingId,
    listingTitle,
    checkIn,
    checkOut,
    recipientRole,
  }: BookingDates & {
    recipientId: string
    bookingId: string
    listingTitle: string
    recipientRole: 'guest' | 'host'
  }) => {
    const message = `Golewood: бронь «${listingTitle}» ${checkIn}–${checkOut} отменена.`

    await notifyUser({
      userId: recipientId,
      smsMessage: message,
      emailSubject: 'Бронь отменена — Golewood',
      maxMessage: message,
      maxBookingId: bookingId,
      maxAudience: recipientRole,
    })
  },

  messageReceived: async ({
    recipientId,
    listingTitle,
    preview,
    recipientRole,
  }: {
    recipientId: string
    listingTitle: string
    preview: string
    recipientRole: 'guest' | 'host'
  }) => {
    const snippet = preview.length > 80 ? `${preview.slice(0, 77)}…` : preview
    const message = `Golewood: сообщение по «${listingTitle}»: ${snippet}`

    if (recipientRole === 'host') {
      await notifyHost(recipientId, message, 'Новое сообщение — Golewood')
      return
    }

    await notifyUser({
      userId: recipientId,
      smsMessage: message,
      emailSubject: 'Новое сообщение — Golewood',
      maxMessage: message,
      maxAudience: 'guest',
    })
  },

  conversationStarted: async ({
    hostId,
    listingTitle,
    guestName,
  }: {
    hostId: string
    listingTitle: string
    guestName: string
  }) => {
    const message = `Golewood: гость ${guestName} начал чат по «${listingTitle}». Откройте «Сообщения» на сайте.`

    await notifyHost(hostId, message, 'Новый диалог — Golewood')
  },

}

export const notificationService = {
  ...notificationCore,
  notifyBookingCreated: (input: Parameters<typeof notificationCore.bookingCreated>[0]) => {
    sendSafe(notificationCore.bookingCreated(input))
  },
  notifyBookingConfirmed: (input: Parameters<typeof notificationCore.bookingConfirmed>[0]) => {
    sendSafe(notificationCore.bookingConfirmed(input))
  },
  notifyBookingCancelled: (input: Parameters<typeof notificationCore.bookingCancelled>[0]) => {
    sendSafe(notificationCore.bookingCancelled(input))
  },
  notifyMessageReceived: (input: Parameters<typeof notificationCore.messageReceived>[0]) => {
    sendSafe(notificationCore.messageReceived(input))
  },
  notifyConversationStarted: (input: Parameters<typeof notificationCore.conversationStarted>[0]) => {
    sendSafe(notificationCore.conversationStarted(input))
  },
}
