import { sendMessageSchema } from '#shared/schemas/conversation'
import { requireAuth } from '../../../utils/auth'
import { conversationService } from '../../../services/conversation.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing conversation id' })
  }

  const body = await readBody(event)
  const input = sendMessageSchema.parse(body)

  return conversationService.sendMessage(id, user.id, input)
})
