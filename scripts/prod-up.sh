#!/usr/bin/env bash
# Production stack on VPS. Run from repo root after .env is filled and check:prod passes.
# Usage: ./scripts/prod-up.sh [--migrate]
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "${root}"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy deploy/.env.production.example and fill secrets." >&2
  exit 1
fi

if grep -q 'CHANGE_ME' .env 2>/dev/null; then
  echo "Replace CHANGE_ME_* placeholders in .env before deploy." >&2
  echo "Generate secrets: ./scripts/generate-prod-secrets.sh" >&2
  exit 1
fi

echo "→ docker compose -f docker-compose.prod.yml up -d --build"
docker compose -f docker-compose.prod.yml up -d --build

if [[ "${1:-}" == "--migrate" ]] || [[ "${RUN_MIGRATE:-}" == "1" ]]; then
  echo "→ npm run db:migrate (in app container)"
  docker compose -f docker-compose.prod.yml exec app npm run db:migrate
fi

echo ""
echo "Done. Next steps:"
echo "  1. Caddy/nginx → 127.0.0.1:3000 (see deploy/Caddyfile.example)"
echo "  2. Admin → Reindex search (or POST /api/admin/search/reindex)"
echo "  3. SITE_URL=https://<domain> npm run smoke:prod"
