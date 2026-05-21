import { requireAuth } from '../../utils/auth'
import { conversationService } from '../../services/conversation.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return conversationService.listForUser(user.id)
})
