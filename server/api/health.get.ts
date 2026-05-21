import { sql } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { getMeiliClient } from '../utils/meili'
import { getRedis } from '../utils/redis'

export default defineEventHandler(async () => {
  const checks = {
    postgres: false,
    redis: false,
    meilisearch: false,
  }

  try {
    const db = getDb()
    await db.execute(sql`select 1`)
    checks.postgres = true
  } catch {
    checks.postgres = false
  }

  try {
    const redis = getRedis()
    const pong = await redis.ping()
    checks.redis = pong === 'PONG'
  } catch {
    checks.redis = false
  }

  try {
    const meili = await getMeiliClient().health()
    checks.meilisearch = meili.status === 'available'
  } catch {
    checks.meilisearch = false
  }

  const ok = checks.postgres && checks.redis && checks.meilisearch

  if (!ok) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: checks,
    })
  }

  return {
    ok: true,
    checks,
  }
})
