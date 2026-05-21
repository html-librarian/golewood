#!/usr/bin/env bash
# Create GitHub repo and push main (requires GitHub CLI: brew install gh && gh auth login).
# Usage:
#   ./scripts/github-setup.sh [org/repo-name]
#   GITHUB_REPO=golewood/golewood.ru ./scripts/github-setup.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "${root}"

repo="${1:-${GITHUB_REPO:-golewood/golewood.ru}}"
visibility="${GITHUB_VISIBILITY:-private}"

if ! command -v gh &>/dev/null; then
  echo "GitHub CLI (gh) not found." >&2
  echo "  brew install gh && gh auth login" >&2
  echo "Then re-run, or push manually:" >&2
  echo "  GIT_REMOTE=git@github.com:${repo}.git ./scripts/git-push-main.sh" >&2
  exit 1
fi

if git remote get-url origin &>/dev/null; then
  echo "→ origin already set: $(git remote get-url origin)"
  echo "→ git push -u origin main"
  git push -u origin main
  exit 0
fi

echo "→ gh repo create ${repo} (--${visibility})"
gh repo create "${repo}" \
  --"${visibility}" \
  --source=. \
  --remote=origin \
  --push \
  --description "Golewood — marketplace for short-term rentals"

echo ""
echo "→ Open Actions: https://github.com/${repo}/actions"
