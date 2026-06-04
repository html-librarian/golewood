import { storyService } from '../../../services/story.service'

export default defineEventHandler(async (event) => {
  const hostId = getRouterParam(event, 'id')!
  return storyService.listRepostedForHostProfile(hostId)
})
