#!/usr/bin/env bash
# External cron (optional). Disable in-app timers:
#   NUXT_CALENDAR_SYNC_CRON_ENABLED=false
#   NUXT_PROMOTION_INDEX_CRON_ENABLED=false
set -euo pipefail

SITE_URL="${NUXT_PUBLIC_SITE_URL:?NUXT_PUBLIC_SITE_URL}"
SECRET="${NUXT_CRON_SECRET:?NUXT_CRON_SECRET}"

curl -fsS -X POST "${SITE_URL}/api/cron/calendar-sync" \
  -H "X-Cron-Secret: ${SECRET}" \
  -H 'Content-Type: application/json'

curl -fsS -X POST "${SITE_URL}/api/cron/promotion-index" \
  -H "X-Cron-Secret: ${SECRET}" \
  -H 'Content-Type: application/json'

echo "cron OK"
