import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSmsSend = vi.fn().mockResolvedValue({ sent: false, provider: 'console' })
const mockEmailSend = vi.fn().mockResolvedValue({ sent: false, provider: 'console' })
const mockMaxHostNotification = vi.fn().mockResolvedValue({ sent: false, provider: 'none' })
const mockMaxGuestNotification = vi.fn().mockResolvedValue({ sent: false, provider: 'none' })
const mockDbSelect = vi.fn()

vi.mock('./sms.service', () => ({
  smsService: {
    send: mockSmsSend,
  },
}))

vi.mock('./email.service', () => ({
  emailService: {
    send: mockEmailSend,
  },
}))

vi.mock('../utils/db', () => ({
  getDb: () => ({
    select: mockDbSelect,
  }),
}))

vi.mock('./max.service', () => ({
  maxService: {
    sendHostNotification: mockMaxHostNotification,
    sendGuestNotification: mockMaxGuestNotification,
  },
}))

describe('notificationService', () => {
  beforeEach(() => {
    mockSmsSend.mockClear()
    mockEmailSend.mockClear()
    mockDbSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ phone: '+79000000002', email: 'host@golewood.local' }]),
        }),
      }),
    })
  })

  it('sends SMS to host on new booking', async () => {
    const { notificationService } = await import('./notification.service')

    await notificationService.bookingCreated({
      hostId: 'host-id',
      bookingId: '11111111-2222-4333-8444-555555555555',
      listingTitle: 'Студия',
      checkIn: '2026-08-15',
      checkOut: '2026-08-17',
    })

    expect(mockSmsSend).toHaveBeenCalledWith({
      phone: '+79000000002',
      message: 'Golewood: новая бронь «Студия» 2026-08-15–2026-08-17. Подтвердите в мини-приложении или на сайте.',
      channel: 'notification',
    })

    expect(mockMaxHostNotification).toHaveBeenCalledWith(
      'host-id',
      'Golewood: новая бронь «Студия» 2026-08-15–2026-08-17. Подтвердите в мини-приложении или на сайте.',
      { bookingId: '11111111-2222-4333-8444-555555555555' },
    )
  })

  it('sends SMS to guest on confirmation', async () => {
    const { notificationService } = await import('./notification.service')

    await notificationService.bookingConfirmed({
      guestId: 'guest-id',
      bookingId: '11111111-2222-4333-8444-555555555555',
      listingTitle: 'Студия',
      checkIn: '2026-08-15',
      checkOut: '2026-08-17',
    })

    expect(mockSmsSend).toHaveBeenCalledWith({
      phone: '+79000000002',
      message: 'Golewood: бронь «Студия» 2026-08-15–2026-08-17 подтверждена.',
      channel: 'notification',
    })

    expect(mockMaxGuestNotification).toHaveBeenCalledWith(
      'guest-id',
      'Golewood: бронь «Студия» 2026-08-15–2026-08-17 подтверждена.',
      { bookingId: '11111111-2222-4333-8444-555555555555' },
    )
  })
})
