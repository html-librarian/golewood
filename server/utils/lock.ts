import { getRedis } from './redis'

export const acquireLock = async (key: string, ttlSeconds = 30) => {
  try {
    const redis = getRedis()
    const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX')

    return result === 'OK'
  } catch {
    return true
  }
}

export const releaseLock = async (key: string) => {
  try {
    const redis = getRedis()
    await redis.del(key)
  } catch {
    // Redis unavailable — lock expires via TTL
  }
}

export const bookingLockKey = (listingId: string, checkIn: string, checkOut: string) =>
  `lock:booking:${listingId}:${checkIn}:${checkOut}`
