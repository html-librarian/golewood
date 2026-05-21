import { requireRole } from '../../../utils/auth'
import { meilisearchService } from '../../../services/meilisearch.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const count = await meilisearchService.reindexAll()

  return { ok: true, indexed: count }
})
