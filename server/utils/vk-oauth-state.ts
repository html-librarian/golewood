import { getRedis } from './redis'

const keyFor = (state: string) => `vk:oauth:state:${state}`
const TTL_SEC = 600

export const storeVkOAuthVerifier = async (state: string, verifier: string) => {
  const redis = getRedis()
  await redis.set(keyFor(state), verifier, 'EX', TTL_SEC)
}

export const consumeVkOAuthVerifier = async (state: string) => {
  const redis = getRedis()
  const verifier = await redis.get(keyFor(state))

  if (verifier) {
    await redis.del(keyFor(state))
  }

  return verifier
}
