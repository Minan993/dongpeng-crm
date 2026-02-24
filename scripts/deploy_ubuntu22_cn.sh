#!/usr/bin/env bash
set -euo pipefail

DOMAIN="dp1972.cn"
EMAIL="admin@dp1972.cn"
APP_DIR="/opt/dongpeng-crm"

sudo mkdir -p "$APP_DIR"
sudo rsync -a --delete ./ "$APP_DIR"/
cd "$APP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

sudo mkdir -p /etc/docker
cat <<JSON | sudo tee /etc/docker/daemon.json >/dev/null
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://hub-mirror.c.163.com"
  ]
}
JSON
sudo systemctl restart docker

if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
fi

sudo apt-get update
sudo apt-get install -y certbot
sudo mkdir -p /var/www/certbot

if [ ! -f .env ]; then
  cp .env.example .env
  echo "请先编辑 $APP_DIR/.env 后重新执行脚本"
  exit 1
fi

docker compose up -d postgres app

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  docker run -d --name temp-nginx -p 80:80 -v /var/www/certbot:/usr/share/nginx/html:ro nginx:alpine
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --agree-tos --email "$EMAIL" --non-interactive
  docker rm -f temp-nginx
fi

docker compose up -d

echo "部署完成: https://$DOMAIN"
