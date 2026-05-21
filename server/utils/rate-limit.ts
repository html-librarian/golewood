import type { H3Event } from 'h3'
import { getRedis } from './redis'

interface RateLimitRule {
  prefix: string
  methods?: string[]
  max: number
  windowSec: number
}

const DEFAULT_RULES: RateLimitRule[] = [
  { prefix: '/api/auth/', max: 150, windowSec: 60 },
  { prefix: '/api/bookings', methods: ['POST'], max: 15, windowSec: 60 },
  { prefix: '/api/reports', methods: ['POST'], max: 10, windowSec: 60 },
  { prefix: '/api/support', methods: ['POST'], max: 5, windowSec: 60 },
  { prefix: '/api/spotlight/photos', methods: ['POST'], max: 5, windowSec: 60 },
  { prefix: '/api/spotlight/vote', methods: ['POST'], max: 20, windowSec: 60 },
  { prefix: '/api/stories', methods: ['POST'], max: 10, windowSec: 60 },
]

const getClientKey = (event: H3Event) => {
  const forwarded = getHeader(event, 'x-forwarded-for')

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }

  return event.node.req.socket.remoteAddress ?? 'unknown'
}

export const checkRateLimit = async (event: H3Event, rules: RateLimitRule[] = DEFAULT_RULES) => {
  const path = event.path
  const method = event.method

  const rule = rules.find((item) => {
    if (!path.startsWith(item.prefix)) {
      return false
    }

    if (item.methods && !item.methods.includes(method)) {
      return false
    }

    return true
  })

  if (!rule) {
    return
  }

  const config = useRuntimeConfig()
  const max = Number(config.rateLimitMax || rule.max)
  const windowSec = Number(config.rateLimitWindowSec || rule.windowSec)

  if (!max || max <= 0) {
    return
  }
  const clientKey = getClientKey(event)
  const redisKey = `ratelimit:${clientKey}:${rule.prefix}:${method}`

  const redis = getRedis()
  const count = await redis.incr(redisKey)

  if (count === 1) {
    await redis.expire(redisKey, windowSec)
  }

  if (count > max) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    })
  }
}
