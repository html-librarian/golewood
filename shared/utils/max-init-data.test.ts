import { describe, expect, it } from 'vitest'
import {
  computeMaxInitDataHash,
  isMaxInitDataFresh,
  parseMaxInitData,
  validateMaxInitData,
} from './max-init-data'

const BOT_TOKEN = 'test-bot-token-12345'

const buildSignedInitData = (fields: Record<string, string>) => {
  const pairs = Object.entries(fields).map(([key, value]) => [key, encodeURIComponent(value)] as const)
  pairs.sort((a, b) => a[0].localeCompare(b[0]))
  const launchParams = pairs.map(([key, value]) => `${key}=${decodeURIComponent(value)}`).join('\n')
  const hash = computeMaxInitDataHash(launchParams, BOT_TOKEN)
  const query = [...pairs.map(([key, value]) => `${key}=${value}`), `hash=${hash}`].join('&')

  return query
}

describe('max-init-data', () => {
  it('validates signature and parses user', () => {
    const authDate = Math.floor(Date.now() / 1000)
    const initData = buildSignedInitData({
      auth_date: String(authDate),
      query_id: 'session-1',
      user: JSON.stringify({
        id: 42,
        first_name: 'Max',
        last_name: 'Host',
        username: 'host42',
        language_code: 'ru',
      }),
    })

    expect(validateMaxInitData(initData, BOT_TOKEN)).toBe(true)

    const parsed = parseMaxInitData(initData)

    expect(parsed?.maxUserId).toBe(42)
    expect(parsed?.user.first_name).toBe('Max')
    expect(isMaxInitDataFresh(authDate)).toBe(true)
  })

  it('rejects tampered hash', () => {
    const initData = buildSignedInitData({
      auth_date: String(Math.floor(Date.now() / 1000)),
      user: JSON.stringify({ id: 1, first_name: 'A' }),
    })

    const tampered = initData.replace(/hash=[a-f0-9]+/, 'hash=deadbeef')

    expect(validateMaxInitData(tampered, BOT_TOKEN)).toBe(false)
  })

  it('rejects stale auth_date', () => {
    const oldDate = Math.floor(Date.now() / 1000) - 7200

    expect(isMaxInitDataFresh(oldDate)).toBe(false)
  })
})
