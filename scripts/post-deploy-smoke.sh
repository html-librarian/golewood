#!/usr/bin/env bash
# Quick smoke after deploy. Usage:
#   SITE_URL=https://golewood.ru ./scripts/post-deploy-smoke.sh
set -euo pipefail

SITE_URL="${SITE_URL:-${NUXT_PUBLIC_SITE_URL:-http://127.0.0.1:3000}}"
SITE_URL="${SITE_URL%/}"

echo "Smoke: ${SITE_URL}"

health="$(curl -fsS "${SITE_URL}/api/health")"
if ! echo "${health}" | grep -q '"ok":true'; then
  echo "health response invalid (expected JSON with ok:true): ${health}" | head -c 400 >&2
  exit 1
fi
echo "health: ok"

for path in / /search /sitemap.xml; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${SITE_URL}${path}")"
  if [ "${code}" != "200" ]; then
    echo "${path} returned HTTP ${code}" >&2
    exit 1
  fi
  echo "${path}: HTTP ${code}"
done

search="$(curl -fsS "${SITE_URL}/api/search?city=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&limit=1")"
if ! echo "${search}" | grep -q '"items"'; then
  echo "search response invalid (expected items array): ${search}" | head -c 400 >&2
  exit 1
fi
echo "search: items present"

echo "OK"
