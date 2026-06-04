import { describe, expect, it } from 'vitest'
import {
  buildVkCodeChallenge,
  generateVkCodeVerifier,
  parseVkIdCallbackQuery,
} from './vk-id-oauth'

describe('vk-id-oauth', () => {
  it('builds S256 code challenge from verifier', () => {
    const verifier = 'test-verifier-123'
    const challenge = buildVkCodeChallenge(verifier)

    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(challenge).not.toBe(verifier)
  })

  it('generates verifiers with enough entropy', () => {
    expect(generateVkCodeVerifier().length).toBeGreaterThanOrEqual(32)
  })

  it('parses payload JSON from VK redirect', () => {
    const payload = JSON.stringify({
      code: 'abc',
      state: 'xyz',
      device_id: 'dev-1',
      type: 'code_v2',
    })

    expect(parseVkIdCallbackQuery({ payload })).toEqual({
      code: 'abc',
      state: 'xyz',
      deviceId: 'dev-1',
    })
  })

  it('parses flat query params', () => {
    expect(parseVkIdCallbackQuery({
      code: 'abc',
      state: 'xyz',
      device_id: 'dev-1',
    })).toEqual({
      code: 'abc',
      state: 'xyz',
      deviceId: 'dev-1',
    })
  })
})
