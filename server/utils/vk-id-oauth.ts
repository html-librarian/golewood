import { createHash, randomBytes } from 'node:crypto'

export type VkIdCallbackPayload = {
  code: string
  state: string
  deviceId: string
}

export const generateVkOAuthState = () => randomBytes(32).toString('base64url')

export const generateVkCodeVerifier = () => randomBytes(48).toString('base64url')

export const buildVkCodeChallenge = (verifier: string) =>
  createHash('sha256').update(verifier).digest('base64url')

export const parseVkIdCallbackQuery = (query: Record<string, unknown>): VkIdCallbackPayload | null => {
  if (typeof query.payload === 'string') {
    try {
      const payload = JSON.parse(query.payload) as {
        code?: string
        state?: string
        device_id?: string
      }

      if (payload.code && payload.state && payload.device_id) {
        return {
          code: payload.code,
          state: payload.state,
          deviceId: payload.device_id,
        }
      }
    } catch {
      return null
    }
  }

  if (
    typeof query.code === 'string'
    && typeof query.state === 'string'
    && typeof query.device_id === 'string'
  ) {
    return {
      code: query.code,
      state: query.state,
      deviceId: query.device_id,
    }
  }

  return null
}
