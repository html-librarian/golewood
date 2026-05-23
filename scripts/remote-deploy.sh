#!/usr/bin/env bash
# Run on VPS after git pull (also invoked from GitHub Actions deploy workflow).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "${root}"

compose_file="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [[ ! -f .env ]]; then
  echo "Missing .env in ${root}" >&2
  exit 1
fi

if grep -q 'CHANGE_ME' .env 2>/dev/null; then
  echo "Replace CHANGE_ME_* placeholders in .env before deploy." >&2
  exit 1
fi

echo "→ git pull"
git pull --ff-only origin main

echo "→ docker compose up -d --build"
docker compose -f "${compose_file}" up -d --build

echo "→ db:migrate"
docker compose -f "${compose_file}" exec -T app npm run db:migrate

if [[ -n "${SITE_URL:-}" ]]; then
  echo "→ smoke"
  SITE_URL="${SITE_URL}" ./scripts/post-deploy-smoke.sh
else
  echo "→ health (local)"
  curl -fsS http://127.0.0.1:3000/api/health | grep -q '"ok":true'
fi

echo "Deploy OK"
