#!/usr/bin/env bash
# One-shot local dev setup. From repo root: ./scripts/bootstrap-dev.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "${root}"

echo "→ Docker (postgres, redis, meilisearch)"
docker compose up -d

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "→ Created .env from .env.example"
fi

echo "→ npm ci"
npm ci

echo "→ Migrations"
npm run db:migrate

echo "→ Russia cities catalog"
npm run db:seed:cities

echo "→ Seed demo data"
npm run db:seed

echo ""
echo "Done. Start the app: npm run dev"
echo "Open http://localhost:3000 — OTP 0000 (admin@golewood.local, host@golewood.local, guest@golewood.local)"
