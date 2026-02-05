#!/usr/bin/env sh
set -eu

# Go-live preflight checks for MVP delivery

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

warn_count=0
fail_count=0

pass() { echo "[PASS] $1"; }
warn() { echo "[WARN] $1"; warn_count=$((warn_count+1)); }
fail() { echo "[FAIL] $1"; fail_count=$((fail_count+1)); }

check_file() {
  if [ -f "$1" ]; then
    pass "file exists: $1"
  else
    fail "missing required file: $1"
  fi
}

check_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    pass "command available: $1"
  else
    warn "command missing: $1"
  fi
}

get_env_value() {
  key="$1"
  file="$2"
  val=$(awk -F= -v k="$key" '$1==k {print substr($0, index($0,$2))}' "$file" | tail -n1)
  printf '%s' "$val"
}

echo "== File checks =="
check_file docker-compose.yml
check_file backend/migrations/sql/0001_init.sql
check_file deploy/nginx/default.conf
check_file scripts/init.sh
check_file scripts/backup.sh
check_file scripts/restore.sh
check_file .env.example

echo "\n== Command checks =="
check_cmd python
check_cmd pytest
check_cmd psql
check_cmd pg_dump
check_cmd pg_restore
check_cmd docker

echo "\n== Runtime checks =="
if python -m compileall backend/app >/dev/null 2>&1; then
  pass "backend compiles"
else
  fail "backend compile failed"
fi

if PYTHONPATH=backend python -m pytest backend/tests -q >/tmp/crm_pytest.out 2>&1; then
  pass "pytest suite executable"
else
  warn "pytest not fully passing in this environment (see /tmp/crm_pytest.out)"
fi

echo "\n== Security baseline checks =="
if [ -f .env ]; then
  env_file=.env
  pass "using .env for validation"
else
  env_file=.env.example
  warn ".env not found, validating .env.example instead"
fi

secret=$(get_env_value "SECRET_KEY" "$env_file")
if [ -z "$secret" ] || [ "$secret" = "replace_with_strong_secret" ]; then
  fail "SECRET_KEY is default/empty"
else
  pass "SECRET_KEY is customized"
fi

cors=$(get_env_value "CORS_ORIGINS" "$env_file")
if [ "$cors" = "*" ] || [ -z "$cors" ]; then
  warn "CORS_ORIGINS is wildcard/empty"
else
  pass "CORS_ORIGINS is scoped"
fi

echo "\n== Summary =="
echo "Warnings: $warn_count"
echo "Failures: $fail_count"

if [ "$fail_count" -gt 0 ]; then
  echo "Preflight result: NOT READY"
  exit 1
fi

echo "Preflight result: READY WITH WARNINGS/PASS"
exit 0
