import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockConfig = { smtpUrl: '' }

vi.stubGlobal('useRuntimeConfig', () => mockConfig)
vi.stubGlobal('createError', (error: { statusCode: number, statusMessage: string }) => {
  const err = new Error(error.statusMessage) as Error & { statusCode: number }
  err.statusCode = error.statusCode
  return err
})
vi.stubGlobal('fetch', vi.fn())

describe('emailService', () => {
  beforeEach(() => {
    mockConfig.smtpUrl = ''
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs to console when SMTP is not configured', async () => {
    const { emailService } = await import('./email.service')

    const result = await emailService.send({
      to: 'guest@golewood.local',
      subject: 'Новая бронь',
      text: 'Бронь подтверждена',
    })

    expect(result).toEqual({ sent: false, provider: 'console' })
    expect(console.log).toHaveBeenCalledWith('[email] guest@golewood.local: Новая бронь — Бронь подтверждена')
  })
})
