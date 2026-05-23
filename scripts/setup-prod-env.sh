#!/usr/bin/env bash
# Generate production .env from deploy/.env.production.example with random secrets.
# Usage:
#   ./scripts/setup-prod-env.sh                          # https://golewood.ru
#   ./scripts/setup-prod-env.sh --domain staging.golewood.ru
#   ./scripts/setup-prod-env.sh --domain https://golewood.ru --output .env
#   ./scripts/setup-prod-env.sh --force                  # overwrite existing .env
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "${root}"

template="${root}/deploy/.env.production.example"
output="${root}/.env"
domain="golewood.ru"
force=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      domain="${2:?missing value for --domain}"
      shift 2
      ;;
    --output)
      output="${2:?missing value for --output}"
      shift 2
      ;;
    --force)
      force=true
      shift
      ;;
    -h | --help)
      sed -n '2,7p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

domain="${domain#https://}"
domain="${domain#http://}"
domain="${domain%/}"
site_url="https://${domain}"

if [[ ! -f "${template}" ]]; then
  echo "Missing template: ${template}" >&2
  exit 1
fi

if [[ -f "${output}" && "${force}" != true ]]; then
  echo "${output} already exists. Use --force to overwrite (current file → ${output}.bak)." >&2
  exit 1
fi

if [[ -f "${output}" ]]; then
  cp "${output}" "${output}.bak"
  echo "Backed up to ${output}.bak"
fi

postgres_password="$(openssl rand -hex 32)"
jwt_secret="$(openssl rand -hex 32)"
cron_secret="$(openssl rand -hex 24)"
meili_key="$(openssl rand -hex 24)"
max_webhook_secret="$(openssl rand -hex 32)"

database_url="postgresql://golewood:${postgres_password}@postgres:5432/golewood"

sed \
  -e "s|POSTGRES_PASSWORD=CHANGE_ME_LONG_RANDOM|POSTGRES_PASSWORD=${postgres_password}|" \
  -e "s|NUXT_DATABASE_URL=postgresql://golewood:CHANGE_ME_LONG_RANDOM@postgres:5432/golewood|NUXT_DATABASE_URL=${database_url}|" \
  -e "s|NUXT_MEILI_API_KEY=CHANGE_ME_MEILI_MASTER_KEY_MIN_16_CHARS|NUXT_MEILI_API_KEY=${meili_key}|" \
  -e "s|NUXT_JWT_SECRET=CHANGE_ME_JWT_AT_LEAST_32_CHARS|NUXT_JWT_SECRET=${jwt_secret}|" \
  -e "s|NUXT_CRON_SECRET=CHANGE_ME_CRON_SECRET|NUXT_CRON_SECRET=${cron_secret}|" \
  -e "s|NUXT_PUBLIC_SITE_URL=https://golewood.ru|NUXT_PUBLIC_SITE_URL=${site_url}|" \
  -e "s|NUXT_CORS_ORIGIN=https://golewood.ru|NUXT_CORS_ORIGIN=${site_url}|" \
  "${template}" > "${output}"

{
  echo ""
  echo "# --- Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) by setup-prod-env.sh ---"
  echo "# MAX webhook secret (uncomment when enabling MAX):"
  echo "# NUXT_MAX_WEBHOOK_SECRET=${max_webhook_secret}"
  echo "#"
  echo "# Fill before preflight:prod passes:"
  echo "#   NUXT_YOOKASSA_SHOP_ID, NUXT_YOOKASSA_SECRET_KEY"
  echo "#   NUXT_S3_BUCKET, NUXT_S3_ACCESS_KEY, NUXT_S3_SECRET_KEY, NUXT_S3_ENDPOINT, NUXT_S3_PUBLIC_URL"
  echo "#   NUXT_SMTP_URL (replace placeholder if not using your-mailer.example)"
  echo "#   NUXT_PUBLIC_OPERATOR_* (legal requisites)"
  echo "# Optional: NUXT_OAUTH_YANDEX_*, NUXT_OAUTH_VK_*"
} >> "${output}"

chmod 600 "${output}" 2>/dev/null || true

echo ""
echo "Created ${output} for ${site_url}"
echo ""
echo "Secrets generated: POSTGRES_PASSWORD, JWT, CRON, Meili master key."
echo "MAX webhook secret saved in file footer (commented)."
echo ""
echo "Next:"
echo "  1. Edit ${output} — YooKassa, S3, SMTP, operator requisites"
echo "  2. npm run preflight:prod"
echo "  3. npm run prod:up   (on VPS with this .env in project root)"
