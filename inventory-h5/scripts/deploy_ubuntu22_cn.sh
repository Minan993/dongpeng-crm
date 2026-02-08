#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
fi

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    echo "Docker already installed"
    return
  fi
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER" || true
}

configure_docker_mirror() {
  sudo mkdir -p /etc/docker
  sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://hub-mirror.c.163.com"
  ]
}
JSON
  sudo systemctl daemon-reload
  sudo systemctl restart docker
}

get_public_ip() {
  local ip
  ip="$(curl -s --max-time 5 https://ifconfig.me || true)"
  if [ -z "$ip" ]; then
    ip="$(hostname -I | awk '{print $1}')"
  fi
  echo "$ip"
}

install_docker
configure_docker_mirror

export NPM_REGISTRY="https://registry.npmmirror.com"
docker compose up -d --build

echo "Waiting for health endpoint..."
for i in {1..60}; do
  if curl -fsS "http://127.0.0.1:8000/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    echo "Health check failed" >&2
    docker compose ps
    exit 1
  fi
done

PUBLIC_IP="$(get_public_ip)"
echo "✅ 前台: http://${PUBLIC_IP}:8000/"
echo "✅ 管理台: http://${PUBLIC_IP}:8000/admin"
echo "✅ 健康检查: http://${PUBLIC_IP}:8000/api/health"
