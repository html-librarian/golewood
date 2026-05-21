import type { H3Event } from 'h3'

export const requireCronSecret = (event: H3Event) => {
  const config = useRuntimeConfig()
  const expected = (config.cronSecret as string)?.trim()

  if (!expected) {
    throw createError({ statusCode: 503, statusMessage: 'Cron jobs are not configured' })
  }

  const header = getHeader(event, 'x-cron-secret')?.trim()
  const auth = getHeader(event, 'authorization')?.trim()
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : ''

  if (header !== expected && bearer !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
