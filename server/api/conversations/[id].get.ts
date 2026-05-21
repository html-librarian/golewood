import { requireAuth } from '../../utils/auth'
import { conversationService } from '../../services/conversation.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing conversation id' })
  }

  return conversationService.getById(id, user.id)
})
