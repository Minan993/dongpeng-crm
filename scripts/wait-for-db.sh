#!/usr/bin/env sh
set -e

HOST="${POSTGRES_HOST:-db}"
PORT="${POSTGRES_PORT:-5432}"
USER="${POSTGRES_USER:-crm}"
DB="${POSTGRES_DB:-crm}"

for i in $(seq 1 60); do
  if pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" >/dev/null 2>&1; then
    echo "PostgreSQL is ready"
    exit 0
  fi
  echo "[$i/60] waiting for PostgreSQL..."
  sleep 2
done

echo "PostgreSQL not ready after timeout"
exit 1
