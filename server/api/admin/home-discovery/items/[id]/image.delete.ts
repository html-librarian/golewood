import { homeDiscoveryService } from '../../../../../services/home-discovery.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing item id' })
  }

  return homeDiscoveryService.clearImage(id)
})
