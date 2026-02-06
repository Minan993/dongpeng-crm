#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "[1/8] 安装系统依赖 (git/curl/nginx/build-essential)..."
sudo apt update
sudo apt install -y git curl nginx build-essential

if ! command -v node >/dev/null 2>&1; then
  echo "[2/8] 安装 Node.js 20 (nvm)..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
else
  echo "[2/8] 检测到 Node: $(node -v)"
fi

echo "[3/8] 配置 npm 国内镜像..."
npm config set registry https://registry.npmmirror.com

echo "[4/8] 安装项目依赖..."
npm install

if [ ! -f .env ]; then
  echo "[5/8] 生成 .env 文件..."
  cp .env.example .env
else
  echo "[5/8] 检测到已有 .env，保留并更新关键项..."
fi

echo "[6/8] 设置管理员账户 admin / 123（写入 bcrypt 哈希）..."
ADMIN_HASH="$(node -e "console.log(require('bcryptjs').hashSync('123',10))")"
if grep -q '^ADMIN_USER=' .env; then
  sed -i 's/^ADMIN_USER=.*/ADMIN_USER=admin/' .env
else
  echo 'ADMIN_USER=admin' >> .env
fi
if grep -q '^ADMIN_PASSWORD_HASH=' .env; then
  sed -i "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=${ADMIN_HASH}|" .env
else
  echo "ADMIN_PASSWORD_HASH=${ADMIN_HASH}" >> .env
fi
if grep -q '^JWT_SECRET=' .env; then
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 24)|" .env
else
  echo "JWT_SECRET=$(openssl rand -hex 24)" >> .env
fi

echo "[7/8] 初始化数据库并构建..."
npm run init-db
npm run build

if [ ! -f "client/dist/index.html" ]; then
  echo "[ERROR] 前端构建产物缺失：client/dist/index.html 不存在"
  echo "请检查 npm run build 输出日志"
  exit 1
fi

echo "[8/8] 使用 PM2 启动并设置开机自启..."
npm i -g pm2
# 清理同名历史进程，避免出现多个 dongpeng-crm 实例混跑
pm2 delete dongpeng-crm >/dev/null 2>&1 || true
pm2 start "npm run start" --name dongpeng-crm --cwd "$PROJECT_DIR" --update-env
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" || true

HTTP_CODE="$(curl -s -o /tmp/dp_home_check.html -w "%{http_code}" http://127.0.0.1:3000/ || true)"
if [ "$HTTP_CODE" = "200" ]; then
  echo "[CHECK] 本机访问 http://127.0.0.1:3000/ 成功 (HTTP 200)"
else
  echo "[WARN] 本机访问异常，HTTP $HTTP_CODE（期望 200），请执行：pm2 logs dongpeng-crm"
fi

cat <<'DONE'

================ 部署完成 ================
应用进程：pm2 ls
查看日志：pm2 logs dongpeng-crm

若需 Nginx 反代（80 -> 3000），请按 README 的 Nginx 配置章节执行。

后台账号：admin
后台密码：123
=========================================
DONE
