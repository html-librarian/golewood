/**
 * Production env sanity check. Run before deploy:
 *   npm run preflight:prod
 * Loads `.env` from project root when present (does not override existing env vars).
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')

const loadDotEnv = (filePath: string) => {
  if (!existsSync(filePath)) {
    return
  }

  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const eq = trimmed.indexOf('=')

    if (eq === -1) {
      continue
    }

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadDotEnv(join(root, '.env'))

const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod')

const env = (key: string) => process.env[key]?.trim() ?? ''

const errors: string[] = []
const warnings: string[] = []

const requireNonEmpty = (key: string, label?: string) => {
  if (!env(key)) {
    errors.push(`${label ?? key} is required`)
  }
}

const forbid = (key: string, pattern: RegExp, message: string) => {
  const value = env(key)

  if (value && pattern.test(value)) {
    errors.push(message)
  }
}

requireNonEmpty('NUXT_DATABASE_URL')
requireNonEmpty('NUXT_REDIS_URL')
requireNonEmpty('NUXT_MEILI_HOST')
requireNonEmpty('NUXT_JWT_SECRET')
requireNonEmpty('NUXT_PUBLIC_SITE_URL')

if (env('NUXT_JWT_SECRET').length < 32) {
  errors.push('NUXT_JWT_SECRET must be at least 32 characters')
}

forbid('NUXT_JWT_SECRET', /^change-me/i, 'NUXT_JWT_SECRET must not be the default placeholder')
forbid('NUXT_PUBLIC_SITE_URL', /^https?:\/\/localhost/i, 'NUXT_PUBLIC_SITE_URL must not be localhost in production')

if (env('NUXT_AUTH_DEV_CODE')) {
  errors.push('NUXT_AUTH_DEV_CODE must be unset in production')
}

if (env('NUXT_YOOKASSA_MARKETPLACE_MOCK') === 'true') {
  errors.push('NUXT_YOOKASSA_MARKETPLACE_MOCK must be false in production (use real payout onboarding)')
}

if (isProd && !env('NUXT_PUBLIC_SITE_URL').startsWith('https://')) {
  errors.push('NUXT_PUBLIC_SITE_URL must use HTTPS in production')
}

if (isProd && !env('NUXT_CRON_SECRET')) {
  errors.push('NUXT_CRON_SECRET is required in production (cron endpoints and optional systemd timer)')
}

if (isProd && env('NUXT_CRON_SECRET').length < 16) {
  errors.push('NUXT_CRON_SECRET must be at least 16 characters')
}

if (!env('NUXT_MEILI_API_KEY') || env('NUXT_MEILI_API_KEY').length < 16) {
  errors.push('NUXT_MEILI_API_KEY is required (Meilisearch master key, min 16 chars)')
}

if (!env('NUXT_YOOKASSA_SHOP_ID') || !env('NUXT_YOOKASSA_SECRET_KEY')) {
  const message = 'YooKassa keys missing — booking and promo payments will not work'

  if (isProd) {
    errors.push(message)
  } else {
    warnings.push(`${message} (dev mock only when NODE_ENV is not production)`)
  }
}

if (!env('NUXT_SMTP_URL')) {
  warnings.push('NUXT_SMTP_URL missing — emails only logged to console')
}

const hasOAuth = Boolean(
  env('NUXT_OAUTH_YANDEX_CLIENT_ID') && env('NUXT_OAUTH_YANDEX_CLIENT_SECRET'),
)
  || Boolean(env('NUXT_OAUTH_VK_CLIENT_ID') && env('NUXT_OAUTH_VK_CLIENT_SECRET'))

if (env('NUXT_PUBLIC_EMAIL_AUTH_ENABLED') !== 'true' && !hasOAuth) {
  warnings.push('Enable email auth (NUXT_PUBLIC_EMAIL_AUTH_ENABLED=true + SMTP) or configure OAuth')
}

if (!env('NUXT_S3_BUCKET') || !env('NUXT_S3_PUBLIC_URL')) {
  warnings.push('S3 not configured — uploads use local disk (lost on container rebuild)')
}

if (env('NUXT_MAX_NOTIFICATIONS_ENABLED') === 'true' && !env('NUXT_MAX_BOT_TOKEN')) {
  errors.push('NUXT_MAX_BOT_TOKEN required when NUXT_MAX_NOTIFICATIONS_ENABLED=true')
}

if (env('NUXT_MAX_NOTIFICATIONS_ENABLED') === 'true' && !env('NUXT_MAX_WEBHOOK_SECRET')) {
  warnings.push('NUXT_MAX_WEBHOOK_SECRET missing — MAX webhook will reject unsigned requests')
}

if (env('NUXT_MAX_NOTIFICATIONS_ENABLED') === 'true' && !env('NUXT_PUBLIC_MAX_BOT_USERNAME')) {
  warnings.push('NUXT_PUBLIC_MAX_BOT_USERNAME missing — deep links to the bot will not work')
}

if (env('NUXT_PUBLIC_SMS_AUTH_ENABLED') === 'true' && !env('NUXT_SMS_RU_API_ID')) {
  warnings.push('SMS auth enabled but NUXT_SMS_RU_API_ID is empty')
}

console.log(`\nProduction env check (${isProd ? 'strict' : 'advisory'} mode)\n`)

if (errors.length) {
  console.log('Errors:')

  for (const item of errors) {
    console.log(`  ✗ ${item}`)
  }
}

if (warnings.length) {
  console.log('\nWarnings:')

  for (const item of warnings) {
    console.log(`  ! ${item}`)
  }
}

if (!errors.length && !warnings.length) {
  console.log('  ✓ All checks passed')
}

if (errors.length) {
  process.exit(1)
}

if (!isProd && warnings.length) {
  console.log('\nRe-run with NODE_ENV=production or --prod to treat warnings as advisory only.')
}

process.exit(0)
