import { formatPostgresErrorMessage } from '#shared/utils/postgres-error'

/** Missing table/column or Drizzle/Postgres 42P01 / 42703 after deploy without migrate. */
export const isMissingRelationError = (error: unknown) => {
  const message = formatPostgresErrorMessage(error, String(error))
  return /does not exist/i.test(message) || message.includes('42P01') || message.includes('42703')
}

export const schemaDriftHttpError = (error?: unknown) => {
  const detail = error ? formatPostgresErrorMessage(error, '') : ''

  throw createError({
    statusCode: 503,
    statusMessage: 'Database schema outdated. Run: npm run db:migrate',
    data: {
      hint: 'На сервере: docker compose exec -T app npm run db:migrate (после git pull и --build).',
      ...(detail ? { detail } : {}),
    },
  })
}
