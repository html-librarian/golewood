import { getRedis } from './redis'

const TTL_SECONDS = 60 * 60 * 24

export const getIdempotentResponse = async <T>(key: string) => {
  try {
    const redis = getRedis()
    const cached = await redis.get(`idempotency:${key}`)

    if (!cached) {
      return null
    }

    return JSON.parse(cached) as T
  } catch {
    return null
  }
}

export const saveIdempotentResponse = async <T>(key: string, response: T) => {
  try {
    const redis = getRedis()
    await redis.set(`idempotency:${key}`, JSON.stringify(response), 'EX', TTL_SECONDS)
  } catch {
    // Redis unavailable — booking already created
  }
}
