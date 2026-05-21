#!/usr/bin/env bash
# Push main to GitHub after adding remote. Usage:
#   GIT_REMOTE=git@github.com:org/golewood.ru.git ./scripts/git-push-main.sh
#   ./scripts/git-push-main.sh git@github.com:org/golewood.ru.git
set -euo pipefail

remote="${GIT_REMOTE:-${1:-}}"

if [[ -z "${remote}" ]]; then
  echo "Set remote URL:" >&2
  echo "  GIT_REMOTE=git@github.com:<org>/golewood.ru.git ./scripts/git-push-main.sh" >&2
  echo "  ./scripts/git-push-main.sh git@github.com:<org>/golewood.ru.git" >&2
  exit 1
fi

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "${remote}"
else
  git remote add origin "${remote}"
fi

echo "→ git push -u origin main"
git push -u origin main

echo "→ Check GitHub Actions: https://github.com/$(echo "${remote}" | sed -E 's#.*github.com[:/](.+/.+)(\.git)?$#\1#')/actions"
