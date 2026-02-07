#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

retry() {
  local n=0 max=5 delay=5
  until "$@"; do
    n=$((n+1))
    if [ "$n" -ge "$max" ]; then
      echo "[ERROR] 命令失败: $*"
      echo "请检查网络/DNS/镜像加速配置。"
      return 1
    fi
    echo "[WARN] 第 ${n} 次失败，${delay}s 后重试..."
    sleep "$delay"
  done
}

install_docker_if_needed() {
  if command -v docker >/dev/null 2>&1; then
    echo "[INFO] Docker 已安装"
    return
  fi
  echo "[INFO] 安装 Docker..."
  retry sudo apt-get update
  retry sudo apt-get install -y ca-certificates curl gnupg lsb-release
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  retry sudo apt-get update
  retry sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable --now docker
}

configure_mirror() {
  local daemon=/etc/docker/daemon.json
  local mirror="${DOCKER_MIRROR:-https://docker.m.daocloud.io}"
  echo "[INFO] 配置 Docker 镜像加速: $mirror"
  sudo mkdir -p /etc/docker
  sudo bash -c "cat > $daemon" <<JSON
{
  "registry-mirrors": ["$mirror"]
}
JSON
  sudo systemctl restart docker
}

ensure_env() {
  if [ ! -f .env ]; then
    cp .env.example .env
    sed -i "s#DB_PASSWORD=.*#DB_PASSWORD=$(openssl rand -hex 12)#" .env
    sed -i "s#JWT_SECRET=.*#JWT_SECRET=$(openssl rand -hex 24)#" .env
    echo "[INFO] 已生成 .env"
  fi
}

main() {
  install_docker_if_needed
  configure_mirror
  ensure_env

  echo "[INFO] 拉取基础镜像"
  retry docker pull nginx:1.27-alpine
  retry docker pull postgres:16-alpine
  retry docker pull node:20-alpine

  echo "[INFO] 启动服务"
  retry docker compose build --no-cache
  retry docker compose up -d

  echo "[INFO] 健康检查"
  for i in {1..30}; do
    if curl -fsS http://127.0.0.1/api/health >/dev/null; then
      break
    fi
    sleep 2
  done
  curl -fsS http://127.0.0.1/api/health

  IP="$(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
  echo "\n部署完成，请访问："
  echo "- http://${IP}/"
  echo "- http://${IP}/admin"
}

main "$@"
