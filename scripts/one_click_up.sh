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

replace_or_append_env() {
  local key="$1" value="$2" file="$3"
  if grep -qE "^${key}=" "$file"; then
    sed -i "s#^${key}=.*#${key}=${value}#" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

install_docker_engine() {
  log "installing Docker CE repo and engine packages..."
  dnf install -y dnf-plugins-core curl ca-certificates
  dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo || true
  dnf makecache -y || true
  dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

ensure_docker_ready() {
  if ! command -v docker >/dev/null 2>&1; then
    install_docker_engine
  fi

  if ! docker compose version >/dev/null 2>&1; then
    install_docker_engine
  fi

  if systemctl list-unit-files | grep -q '^docker.service'; then
    systemctl enable docker
    systemctl start docker
  elif systemctl list-unit-files | grep -q '^docker.socket'; then
    systemctl enable docker.socket
    systemctl start docker.socket
  else
    err "docker.service not found after install. please verify OS repo/network manually"
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    err "docker daemon is not running"
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    err "docker compose unavailable"
    exit 1
  fi
}

log "project dir: ${PROJECT_DIR}"
[ -d "$PROJECT_DIR" ] || { err "project dir not found: ${PROJECT_DIR}"; exit 1; }
cd "$PROJECT_DIR"

log "installing base packages (git/nginx/openssl)..."
dnf update -y
dnf install -y git nginx openssl curl || true

log "ensuring Docker engine & compose..."
ensure_docker_ready

log "enabling nginx..."
systemctl enable nginx || true

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
