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

const parsePayloadJson = (raw: string) => {
  const attempts = [raw, decodeURIComponent(raw)]

  for (const value of attempts) {
    try {
      return JSON.parse(value) as {
        code?: string
        state?: string
        device_id?: string
      }
    } catch {
      continue
    }
  }

  return null
}

export const parseVkIdCallbackQuery = (query: Record<string, unknown>): VkIdCallbackPayload | null => {
  if (typeof query.payload === 'string') {
    const payload = parsePayloadJson(query.payload)

    if (payload?.code && payload.state && payload.device_id) {
      return {
        code: payload.code,
        state: payload.state,
        deviceId: payload.device_id,
      }
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
