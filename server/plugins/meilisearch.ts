import { meilisearchService } from '../services/meilisearch.service'

export default defineNitroPlugin(async () => {
  await meilisearchService.ensureIndex().catch(() => undefined)
})
