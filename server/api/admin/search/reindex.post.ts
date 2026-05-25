import { formatPostgresErrorMessage, postgresErrorHint } from '#shared/utils/postgres-error'
import { requireRole } from '../../../utils/auth'
import { meilisearchService } from '../../../services/meilisearch.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  const config = useRuntimeConfig()

  try {
    const count = await meilisearchService.reindexAll()

    return { ok: true, indexed: count }
  } catch (err) {
    const schemaHint = postgresErrorHint(err)
    const meiliHint = config.meiliApiKey
      ? 'Проверьте логи: docker compose logs meilisearch. Ключ NUXT_MEILI_API_KEY должен совпадать с MEILI_MASTER_KEY.'
      : 'В .env на сервере не задан NUXT_MEILI_API_KEY (мин. 16 символов, тот же ключ, что у контейнера meilisearch).'

    throw createError({
      statusCode: 500,
      statusMessage: schemaHint ?? formatPostgresErrorMessage(err, 'Reindex failed'),
      data: {
        hint: schemaHint ?? meiliHint,
      },
    })
  }
})
