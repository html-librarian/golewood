import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { MaxUpdate } from '#shared/types/max'

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}

const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
}

vi.stubGlobal('useRuntimeConfig', () => ({
  maxBotToken: '',
  maxWebhookSecret: 'secret',
  maxNotificationsEnabled: false,
  public: { maxBotUsername: 'golewood_bot', siteUrl: 'http://localhost:3000' },
}))

vi.stubGlobal('createError', (error: { statusCode: number, statusMessage: string }) => {
  const err = new Error(error.statusMessage) as Error & { statusCode: number }
  err.statusCode = error.statusCode
  return err
})

vi.mock('../utils/redis', () => ({
  getRedis: () => mockRedis,
}))

vi.mock('../utils/db', () => ({
  getDb: () => mockDb,
}))

describe('maxService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedis.get.mockResolvedValue('user-uuid')
    mockRedis.set.mockResolvedValue('OK')
    mockRedis.del.mockResolvedValue(1)
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    })
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    })
  })

  it('extracts link code from message text', async () => {
    const { maxService } = await import('./max.service')

    const update: MaxUpdate = {
      update_type: 'message_created',
      chat_id: 1,
      user: { user_id: 42 },
      message: { body: { text: 'GW-AB12CD34' }, sender: { user_id: 42 } },
    }

    expect(maxService.extractLinkCode(update)).toBe('AB12CD34')
  })

  it('binds max user when redis has link code', async () => {
    const { maxService } = await import('./max.service')

    const result = await maxService.bindMaxUser('GW-AB12CD34', 42)

    expect(result.ok).toBe(true)
    expect(mockRedis.del).toHaveBeenCalledWith('max:link:AB12CD34')
  })

  it('verifies webhook secret when configured', async () => {
    const { maxService } = await import('./max.service')

    expect(maxService.verifyWebhookSecret('secret')).toBe(true)
    expect(maxService.verifyWebhookSecret('wrong')).toBe(false)
  })
})
