#!/usr/bin/env bash
# Quick readiness report before production launch.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "${root}"

ok() { printf '  ✓ %s\n' "$1"; }
miss() { printf '  ✗ %s\n' "$1"; }
warn() { printf '  ! %s\n' "$1"; }

echo "Golewood launch status"
echo ""

if git remote get-url origin &>/dev/null; then
  ok "git remote: $(git remote get-url origin)"
else
  miss 'git remote (run scripts/git-push-main.sh)'
fi

commits="$(git rev-list --count HEAD 2>/dev/null || echo 0)"
ok "git commits on main: ${commits}"

if [[ -f .env ]]; then
  ok '.env present'
else
  miss '.env (cp deploy/.env.production.example .env)'
fi

if [[ -f deploy/.env.production.example ]]; then
  ok 'deploy/.env.production.example'
fi

if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  ok 'docker daemon'
else
  warn 'docker not running (needed for prod:up)'
fi

echo ""
echo "Code quality (run manually if unsure):"
echo "  npm run verify:all"
echo ""
echo "Production env:"
if [[ -f .env ]]; then
  if NODE_ENV=production npm run check:prod &>/dev/null; then
    ok 'preflight:prod passed'
  else
    miss 'preflight:prod — fix .env (npm run preflight:prod)'
  fi
else
  warn 'skip preflight until .env exists'
fi

echo ""
echo "Next: LAUNCH.md → VPS steps (DNS, prod:up, Caddy, reindex, smoke:prod)"
