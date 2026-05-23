#!/usr/bin/env bash
# Dump PostgreSQL from docker-compose.prod.yml stack.
# Usage (on VPS, from project root):
#   ./deploy/backup-postgres.sh
#   BACKUP_DIR=/var/backups/golewood RETAIN_DAYS=30 ./deploy/backup-postgres.sh
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"

compose_file="${COMPOSE_FILE:-docker-compose.prod.yml}"
backup_dir="${BACKUP_DIR:-/var/backups/golewood}"
retain_days="${RETAIN_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' .env | grep -E '^[A-Z_]+=' | sed 's/\r$//')
  set +a
fi

postgres_user="${POSTGRES_USER:-golewood}"
postgres_db="${POSTGRES_DB:-golewood}"
archive="${backup_dir}/golewood-${postgres_db}-${timestamp}.sql.gz"

mkdir -p "${backup_dir}"

if ! docker compose -f "${compose_file}" ps --status running postgres 2>/dev/null | grep -q postgres; then
  echo "postgres container is not running (compose: ${compose_file})" >&2
  exit 1
fi

docker compose -f "${compose_file}" exec -T postgres \
  pg_dump -U "${postgres_user}" -d "${postgres_db}" --no-owner --no-acl \
  | gzip -9 > "${archive}"

bytes="$(wc -c < "${archive}" | tr -d ' ')"
echo "backup: ${archive} (${bytes} bytes)"

find "${backup_dir}" -name 'golewood-*.sql.gz' -type f -mtime +"${retain_days}" -delete 2>/dev/null || true
remaining="$(find "${backup_dir}" -name 'golewood-*.sql.gz' -type f | wc -l | tr -d ' ')"
echo "retained: ${remaining} file(s) in ${backup_dir} (last ${retain_days} days)"
