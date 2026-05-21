import { execSync } from 'node:child_process'
import Redis from 'ioredis'

export default async () => {
  const redisUrl = process.env.NUXT_REDIS_URL ?? 'redis://localhost:6379'
  const redis = new Redis(redisUrl)

  try {
    const keys = await redis.keys('ratelimit:*')

    if (keys.length) {
      await redis.del(...keys)
    }
  } finally {
    await redis.quit()
  }

  execSync('npm run db:seed', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, SEED_E2E: '1' },
  })

  execSync('npm run db:seed:cities', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
}
