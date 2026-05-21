import type { MaxUpdate } from '#shared/types/max'
import { maxService } from '../../services/max.service'

export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-max-bot-api-secret')

  if (!maxService.verifyWebhookSecret(secret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook secret' })
  }

  const body = await readBody<MaxUpdate | { updates?: MaxUpdate[] }>(event)
  const updates = Array.isArray((body as { updates?: MaxUpdate[] }).updates)
    ? (body as { updates: MaxUpdate[] }).updates
    : [body as MaxUpdate]

  for (const update of updates) {
    if (update?.update_type) {
      await maxService.handleUpdate(update).catch((error) => {
        console.error('[max webhook]', error)
      })
    }
  }

  return { ok: true }
})
