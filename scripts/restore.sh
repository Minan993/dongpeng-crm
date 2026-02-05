#!/usr/bin/env sh
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore.sh <dump_file>"
  exit 1
fi

DUMP_FILE="$1"
if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE"
  exit 1
fi

export PGPASSWORD=${POSTGRES_PASSWORD:-crm123456}
pg_restore \
  -h "${POSTGRES_HOST:-127.0.0.1}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:-crm}" \
  -d "${POSTGRES_DB:-crm}" \
  --clean --if-exists "$DUMP_FILE"

echo "Restore completed from: $DUMP_FILE"
