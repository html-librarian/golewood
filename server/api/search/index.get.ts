import { searchParamsSchema } from '#shared/schemas/search'
import { searchService } from '../../services/search.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params = searchParamsSchema.parse(query)

  return searchService.search(params)
})
