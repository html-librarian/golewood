import { blogService } from '../../../../services/blog.service'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const listingId = typeof query.listingId === 'string' ? query.listingId : undefined

  return blogService.listAdmin(listingId)
})
