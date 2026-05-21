import { hostService } from '../../services/host.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing host id' })
  }

  return hostService.getPublicProfile(id)
})
