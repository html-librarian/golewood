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

compose=(docker compose -f "${compose_file}")

wait_for_app_health() {
  local url="http://127.0.0.1:3000/api/health"
  local attempt=1
  local max_attempts=45

  echo "→ wait for app (up to $((max_attempts * 2))s)"

  while [[ "${attempt}" -le "${max_attempts}" ]]; do
    if curl -fsS "${url}" 2>/dev/null | grep -q '"ok":true'; then
      echo "   app ready (${attempt} attempt(s))"
      return 0
    fi

    sleep 2
    attempt=$((attempt + 1))
  done

  echo "App did not become healthy in time. Recent logs:" >&2
  "${compose[@]}" logs app --tail 80 >&2 || true
  return 1
}

if [[ "${GOLEWOOD_USE_REGISTRY:-0}" == "1" ]]; then
  if [[ -z "${GHCR_TOKEN:-}" ]]; then
    echo "GOLEWOOD_USE_REGISTRY=1 but GHCR_TOKEN is empty" >&2
    exit 1
  fi
  ghcr_user="${GHCR_USER:-html-librarian}"
  echo "→ docker login ghcr.io"
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${ghcr_user}" --password-stdin
  echo "→ docker compose pull"
  "${compose[@]}" pull app
  echo "→ docker compose up -d --wait"
  if ! "${compose[@]}" up -d --wait 2>/dev/null; then
    echo "   --wait not supported, falling back to up -d"
    "${compose[@]}" up -d
  fi
else
  echo "→ docker compose up -d --build"
  if ! "${compose[@]}" up -d --build --wait 2>/dev/null; then
    "${compose[@]}" up -d --build
  fi
fi

echo "→ db:migrate"
docker compose -f "${compose_file}" exec -T app npm run db:migrate

echo "→ db:seed:cities"
docker compose -f "${compose_file}" exec -T app npm run db:seed:cities

wait_for_app_health

if [[ -n "${SITE_URL:-}" ]]; then
  echo "→ smoke"
  SITE_URL="${SITE_URL}" ./scripts/post-deploy-smoke.sh
else
  echo "→ health (local)"
  curl -fsS http://127.0.0.1:3000/api/health | grep -q '"ok":true'
fi

echo "Deploy OK"
