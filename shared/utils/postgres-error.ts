type PgErrorLike = {
  message?: string
  code?: string
}

const unwrapPgError = (err: unknown): PgErrorLike | null => {
  if (!err || typeof err !== 'object') {
    return null
  }

  if ('cause' in err && err.cause && typeof err.cause === 'object') {
    return err.cause as PgErrorLike
  }

  return err as PgErrorLike
}

export const formatPostgresErrorMessage = (err: unknown, fallback = 'Database error') => {
  const pg = unwrapPgError(err)

  if (pg?.message) {
    return pg.message
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return fallback
}

export const postgresErrorHint = (err: unknown) => {
  const message = formatPostgresErrorMessage(err, '')

  if (/column "[^"]+" does not exist/i.test(message)) {
    return 'Схема БД устарела. На сервере: git pull, docker compose up -d --build, затем docker compose exec -T app npm run db:migrate'
  }

  if (/relation "[^"]+" does not exist/i.test(message)) {
    return 'Таблица не найдена — выполните db:migrate на сервере после деплоя.'
  }

  return null
}
