#!/usr/bin/env sh
set -e

# Usage:
# ./scripts/init.sh
# With demo data: ENABLE_DEMO_DATA=true ./scripts/init.sh

export POSTGRES_HOST=${POSTGRES_HOST:-127.0.0.1}
export POSTGRES_PORT=${POSTGRES_PORT:-5432}
export POSTGRES_DB=${POSTGRES_DB:-crm}
export POSTGRES_USER=${POSTGRES_USER:-crm}
export PGPASSWORD=${POSTGRES_PASSWORD:-crm123456}

./scripts/wait-for-db.sh

echo "Applying SQL migration..."
psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f backend/migrations/sql/0001_init.sql

echo "Initializing admin/roles/permissions..."
PYTHONPATH=backend python -m app.init_db

if [ "${ENABLE_DEMO_DATA}" = "true" ]; then
  PYTHONPATH=backend python scripts/seed_demo.py
fi

echo "Init done"
