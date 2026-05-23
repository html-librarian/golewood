#!/usr/bin/env bash
# Add swap for Nuxt Docker build on small VPS (OOM → SIGKILL during npm run build).
# Usage: sudo ./deploy/add-swap.sh [size_gb]
set -euo pipefail

size_gb="${1:-4}"
swapfile="/swapfile"

if swapon --show | grep -q "${swapfile}"; then
  echo "Swap already active:"
  swapon --show
  free -h
  exit 0
fi

if [[ ! -f "${swapfile}" ]]; then
  echo "→ fallocate ${size_gb}G ${swapfile}"
  fallocate -l "${size_gb}G" "${swapfile}"
  chmod 600 "${swapfile}"
  mkswap "${swapfile}"
fi

swapon "${swapfile}"

if ! grep -q "${swapfile}" /etc/fstab; then
  echo "${swapfile} none swap sw 0 0" >> /etc/fstab
fi

echo "Swap enabled:"
swapon --show
free -h
