#!/bin/sh
set -e

if [ "${RUN_DB_MIGRATE_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] Running database migrations…"
  npm run db:migrate
fi

exec node .output/server/index.mjs
