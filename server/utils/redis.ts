import Redis from 'ioredis'

let redis: Redis | null = null

export const getRedis = () => {
  if (!redis) {
    const config = useRuntimeConfig()
    redis = new Redis(config.redisUrl, {
      connectTimeout: 5_000,
      commandTimeout: 5_000,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    })
  }

  return redis
}

export const closeRedis = async () => {
  if (redis) {
    await redis.quit()
    redis = null
  }
}
