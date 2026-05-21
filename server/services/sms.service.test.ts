import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockConfig = {
  smsRuApiId: '',
  smsNotificationsEnabled: false,
  public: { smsAuthEnabled: false },
}

vi.stubGlobal('useRuntimeConfig', () => mockConfig)
vi.stubGlobal('createError', (error: { statusCode: number, statusMessage: string }) => {
  const err = new Error(error.statusMessage) as Error & { statusCode: number }
  err.statusCode = error.statusCode
  return err
})
vi.stubGlobal('$fetch', vi.fn())

describe('smsService', () => {
  beforeEach(() => {
    vi.resetModules()
    mockConfig.smsRuApiId = ''
    mockConfig.smsNotificationsEnabled = false
    mockConfig.public.smsAuthEnabled = false
    vi.mocked($fetch).mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('skips sms.ru when channel is disabled', async () => {
    const { smsService } = await import('./sms.service')

    const result = await smsService.send({
      phone: '+79000000003',
      message: 'Golewood: ваш код 1234',
      channel: 'auth',
    })

    expect(result).toEqual({ sent: false, provider: 'console' })
    expect($fetch).not.toHaveBeenCalled()
  })

  it('calls sms.ru when auth channel and API key are enabled', async () => {
    mockConfig.smsRuApiId = 'test-api'
    mockConfig.public.smsAuthEnabled = true
    vi.mocked($fetch).mockResolvedValue({ status: 'OK' })

    const { smsService } = await import('./sms.service')

    const result = await smsService.send({
      phone: '+79000000003',
      message: 'Golewood: ваш код 1234',
      channel: 'auth',
    })

    expect(result).toEqual({ sent: true, provider: 'sms.ru' })
    expect($fetch).toHaveBeenCalled()
  })
})
