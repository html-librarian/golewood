import { homeHeroService } from '../../../services/home-hero.service'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  return homeHeroService.uploadBanner({
    data: file.data,
    filename: file.filename,
    type: file.type,
  })
})
