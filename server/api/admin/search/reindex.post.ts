import { requireRole } from '../../../utils/auth'
import { meilisearchService } from '../../../services/meilisearch.service'

const reindexErrorMessage = (err: unknown) => {
  if (err instanceof Error && err.message) {
    return err.message
  }

  return 'Reindex failed'
}

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  const config = useRuntimeConfig()

  try {
    const count = await meilisearchService.reindexAll()

    return { ok: true, indexed: count }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: reindexErrorMessage(err),
      data: {
        hint: config.meiliApiKey
          ? 'Проверьте логи: docker compose logs meilisearch. Ключ NUXT_MEILI_API_KEY должен совпадать с MEILI_MASTER_KEY.'
          : 'В .env на сервере не задан NUXT_MEILI_API_KEY (мин. 16 символов, тот же ключ, что у контейнера meilisearch).',
      },
    })
  }
})
