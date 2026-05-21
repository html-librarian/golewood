import { storyService } from '../../../services/story.service'

export default defineEventHandler(async (event) => {
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  }

  return storyService.listPinnedForListing(listingId)
})
