#!/usr/bin/env bash
# Print random secrets for production .env (paste into deploy/.env.production.example).
set -euo pipefail

echo "# Paste into .env on the server (replace CHANGE_ME_* values)"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)"
echo "NUXT_DATABASE_URL=postgresql://golewood:PASTE_POSTGRES_PASSWORD@postgres:5432/golewood"
echo "NUXT_JWT_SECRET=$(openssl rand -hex 32)"
echo "NUXT_CRON_SECRET=$(openssl rand -hex 24)"
echo "NUXT_MEILI_API_KEY=$(openssl rand -hex 24)"
echo "NUXT_MAX_WEBHOOK_SECRET=$(openssl rand -hex 32)"
