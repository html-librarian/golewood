import { startConversationSchema } from '#shared/schemas/conversation'
import { requireAuth } from '../../utils/auth'
import { conversationService } from '../../services/conversation.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const input = startConversationSchema.parse(body)

  return conversationService.start(user.id, input)
})
