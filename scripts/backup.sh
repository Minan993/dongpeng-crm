#!/usr/bin/env sh
set -e

mkdir -p backups
STAMP=$(date +%F_%H%M%S)
OUT="backups/crm_${STAMP}.dump"

export PGPASSWORD=${POSTGRES_PASSWORD:-crm123456}
pg_dump \
  -h "${POSTGRES_HOST:-127.0.0.1}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:-crm}" \
  -d "${POSTGRES_DB:-crm}" \
  -Fc -f "$OUT"

echo "Backup created: $OUT"
