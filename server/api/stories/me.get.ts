import { requireAuth } from '../../utils/auth'
import { storyService } from '../../services/story.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  return storyService.listMine(user.id)
})
