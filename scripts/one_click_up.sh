#!/usr/bin/env bash
set -euo pipefail

# One-click deploy for Alibaba Cloud Linux 3.2 (root-path friendly)
# Usage:
#   sudo bash scripts/one_click_up.sh
# Optional env overrides:
#   PROJECT_DIR=/root/dongpeng-crm ECS_IP=1.2.3.4 sudo bash scripts/one_click_up.sh

PROJECT_DIR=${PROJECT_DIR:-/root/dongpeng-crm}
ECS_IP=${ECS_IP:-}
APP_ENV_FILE="${PROJECT_DIR}/.env"

log() { echo "[one-click] $*"; }
err() { echo "[one-click][ERROR] $*" >&2; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "missing command: $1"; exit 1; }
}

replace_or_append_env() {
  local key="$1" value="$2" file="$3"
  if grep -qE "^${key}=" "$file"; then
    sed -i "s#^${key}=.*#${key}=${value}#" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

log "project dir: ${PROJECT_DIR}"
[ -d "$PROJECT_DIR" ] || { err "project dir not found: ${PROJECT_DIR}"; exit 1; }
cd "$PROJECT_DIR"

log "installing base packages (docker/git/nginx)..."
dnf update -y
dnf install -y docker git nginx || true

log "enabling and starting docker/nginx..."
systemctl enable docker || true
systemctl start docker
systemctl enable nginx || true

if ! docker compose version >/dev/null 2>&1; then
  log "docker compose plugin missing, trying install..."
  dnf install -y docker-compose-plugin || true
fi

require_cmd docker
if ! docker compose version >/dev/null 2>&1; then
  err "docker compose still unavailable, please install docker compose plugin manually"
  exit 1
fi

if [ ! -f "$APP_ENV_FILE" ]; then
  cp .env.example "$APP_ENV_FILE"
  log "created .env from .env.example"
fi

if [ -z "$ECS_IP" ]; then
  ECS_IP=$(curl -fsSL ifconfig.me || true)
fi
if [ -z "$ECS_IP" ]; then
  ECS_IP="127.0.0.1"
  log "failed to detect public IP, fallback ECS_IP=${ECS_IP}; please edit CORS_ORIGINS manually if needed"
fi

SECRET_KEY=$(openssl rand -hex 32)
DB_PASS=$(openssl rand -hex 16)

log "hardening .env values (SECRET_KEY/CORS/DB password)..."
replace_or_append_env "SECRET_KEY" "$SECRET_KEY" "$APP_ENV_FILE"
replace_or_append_env "POSTGRES_PASSWORD" "$DB_PASS" "$APP_ENV_FILE"
replace_or_append_env "CORS_ORIGINS" "http://${ECS_IP},http://${ECS_IP}:80" "$APP_ENV_FILE"
replace_or_append_env "DATABASE_URL" "postgresql+psycopg2://crm:${DB_PASS}@db:5432/crm" "$APP_ENV_FILE"

log "starting application containers..."
docker compose up -d --build

log "running database init script..."
./scripts/init.sh

log "configuring nginx reverse proxy..."
cp deploy/nginx/default.conf /etc/nginx/conf.d/dongpeng-crm.conf
nginx -t
systemctl restart nginx

if command -v firewall-cmd >/dev/null 2>&1; then
  log "opening host firewall ports 22/80 (if firewalld enabled)..."
  firewall-cmd --permanent --add-port=22/tcp || true
  firewall-cmd --permanent --add-port=80/tcp || true
  firewall-cmd --reload || true
fi

log "running preflight checks..."
./scripts/preflight.sh || {
  err "preflight returned NOT READY; please inspect output and fix before production traffic"
  exit 1
}

log "deploy complete"
log "Access URLs:"
log "  Frontend: http://${ECS_IP}/"
log "  Swagger : http://${ECS_IP}/docs"
log "Default admin: admin / Admin@12345 (must change password on first login)"
log "Reminder: also open Alibaba Cloud security group ports 22 and 80"
