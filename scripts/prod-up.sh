#!/usr/bin/env bash
# Production stack on VPS. Run from repo root after .env is filled and check:prod passes.
# Usage: ./scripts/prod-up.sh [--migrate]
#
# Recommended on VPS: GOLEWOOD_USE_REGISTRY=1 + GHCR_TOKEN (pull CI image, no local build).
# Local build (needs ~6 GB RAM/swap): GOLEWOOD_BUILD_ON_VPS=1
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "${root}"

compose_file="${COMPOSE_FILE:-docker-compose.prod.yml}"
compose=(docker compose -f "${compose_file}")

if [[ ! -f .env ]]; then
  echo "Missing .env — copy deploy/.env.production.example and fill secrets." >&2
  exit 1
fi

if grep -q 'CHANGE_ME' .env 2>/dev/null; then
  echo "Replace CHANGE_ME_* placeholders in .env before deploy." >&2
  echo "Generate secrets: ./scripts/generate-prod-secrets.sh" >&2
  exit 1
fi

if [[ "${GOLEWOOD_USE_REGISTRY:-0}" == "1" ]]; then
  if [[ -z "${GHCR_TOKEN:-}" ]]; then
    echo "GOLEWOOD_USE_REGISTRY=1 but GHCR_TOKEN is empty" >&2
    exit 1
  fi
  ghcr_user="${GHCR_USER:-html-librarian}"
  echo "→ docker login ghcr.io"
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${ghcr_user}" --password-stdin
  echo "→ docker compose pull app"
  "${compose[@]}" pull app
  echo "→ docker compose up -d"
  "${compose[@]}" up -d
elif [[ "${GOLEWOOD_BUILD_ON_VPS:-0}" == "1" ]]; then
  echo "→ building app on VPS (needs ~6 GB RAM or swap — see DEPLOY.md)" >&2
  docker compose -f "${compose_file}" -f docker-compose.build.yml up -d --build
else
  cat >&2 <<'EOF'
Refusing to build on VPS by default (Nitro often gets SIGKILL on small servers).

  Option A (recommended): pull image built by CI
    export GOLEWOOD_USE_REGISTRY=1
    export GHCR_TOKEN=ghp_...   # read:packages
    ./scripts/prod-up.sh --migrate

  Option B: build on this host (add swap first: sudo ./deploy/add-swap.sh 6)
    export GOLEWOOD_BUILD_ON_VPS=1
    ./scripts/prod-up.sh --migrate

  Or: ./scripts/remote-deploy.sh with GOLEWOOD_USE_REGISTRY=1
EOF
  exit 1
fi

if [[ "${1:-}" == "--migrate" ]] || [[ "${RUN_MIGRATE:-}" == "1" ]]; then
  echo "→ npm run db:migrate (in app container)"
  "${compose[@]}" exec -T app npm run db:migrate
  echo "→ npm run db:seed:cities (in app container)"
  "${compose[@]}" exec -T app npm run db:seed:cities
fi

echo ""
echo "Done. Next steps:"
echo "  1. Caddy/nginx → 127.0.0.1:3000 (see deploy/Caddyfile.example)"
echo "  2. Admin → Reindex search (or POST /api/admin/search/reindex)"
echo "  3. SITE_URL=https://<domain> npm run smoke:prod"
