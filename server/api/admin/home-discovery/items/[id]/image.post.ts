import { homeDiscoveryService } from '../../../../../services/home-discovery.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing item id' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  return homeDiscoveryService.uploadImage(id, {
    data: file.data,
    filename: file.filename,
    type: file.type,
  })
})
