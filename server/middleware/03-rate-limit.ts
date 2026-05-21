import { checkRateLimit } from '../utils/rate-limit'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) {
    return
  }

  await checkRateLimit(event)
})
