import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/')) {
    return
  }

  const startedAt = Date.now()

  event.node.res.on('finish', () => {
    logger.info('request', {
      method: event.method,
      path: event.path,
      status: event.node.res.statusCode,
      durationMs: Date.now() - startedAt,
    })
  })
})
