# Alibaba Cloud Linux 3.2 从 0 到上线部署说明（第 7 部分）

> 目标：无域名场景下，通过 `http://<服务器IP>:80` 直接访问 CRM；后续绑定域名时仅需修改 Nginx `server_name` 与证书配置。

## 0. 前置条件

- ECS 系统：Alibaba Cloud Linux 3.2（64 位）
- 已知信息：ECS 公网 IP、root/sudo 权限
- 仓库代码：`dongpeng-crm`

## 0.1 一键上线（适用于项目已放在 `/root/dongpeng-crm`）

```bash
cd /root/dongpeng-crm
sudo bash scripts/one_click_up.sh
```

可选参数：

```bash
sudo PROJECT_DIR=/root/dongpeng-crm ECS_IP=<ECS公网IP> bash scripts/one_click_up.sh
```

该脚本会自动完成：安装依赖、生成安全 `.env` 关键项、`docker compose up`、`init.sh`、Nginx 配置与 `preflight` 校验。

---

## 1. 安全组与防火墙放行

### 1.1 阿里云安全组（必须）

| 端口 | 协议 | 用途 | 是否公网放行 |
|---|---|---|---|
| 22 | TCP | SSH 登录 | 是（建议仅办公 IP） |
| 80 | TCP | Nginx 统一入口（前端 + /api） | 是 |
| 3000 | TCP | 前端直连调试（可选） | 否（建议仅临时） |
| 8000 | TCP | 后端直连调试（可选） | 否（建议仅临时） |

> 不要放行 `5432`，数据库仅容器内通信。

### 1.2 系统防火墙（可选，若启用 firewalld）

```bash
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

---

## 2. 安装 Docker 与 Compose

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable docker
sudo systemctl start docker

# Docker Compose Plugin
sudo dnf install -y docker-compose-plugin || true

docker --version
docker compose version
```

> 如果 `docker compose` 不可用，可安装独立二进制 `docker-compose`（仅兜底）。

---

## 3. 拉取代码并配置环境变量

```bash
git clone <your-repo-url> dongpeng-crm
cd dongpeng-crm
cp .env.example .env
```

**必须修改 `.env`（至少以下项）：**

```env
SECRET_KEY=<使用 openssl rand -hex 32 生成>
CORS_ORIGINS=http://<ECS_IP>,http://<ECS_IP>:80
POSTGRES_PASSWORD=<强密码>
DATABASE_URL=postgresql+psycopg2://crm:<强密码>@db:5432/crm
```

生成随机密钥示例：

```bash
openssl rand -hex 32
```

---

## 4. 启动服务（Docker）

```bash
docker compose up -d --build
docker compose ps
```

健康检查：

```bash
curl -f http://127.0.0.1:8000/health
```

---

## 5. 初始化数据库与管理员

```bash
./scripts/init.sh
```

默认管理员（首次登录强制改密）：

- 用户名：`admin`
- 密码：`Admin@12345`

---

## 6. 上线前自检（强烈建议）

```bash
./scripts/preflight.sh
```

若输出 `NOT READY`，先修复：

- `.env` 中 `SECRET_KEY` 不能是默认值
- `.env` 中 `CORS_ORIGINS` 不应为 `*`
- 补齐 `docker/psql/pg_dump/pg_restore` 等必要命令

---

## 7. Nginx 反向代理（IP 访问）

推荐将对外入口统一到 `80` 端口：

1. 安装 Nginx

```bash
sudo dnf install -y nginx
sudo systemctl enable nginx
```

2. 写入配置（可直接使用仓库模板）

```bash
sudo cp deploy/nginx/default.conf /etc/nginx/conf.d/dongpeng-crm.conf
sudo nginx -t
sudo systemctl restart nginx
```

3. 访问验证（无域名）

- 前端：`http://<ECS_IP>/`
- Swagger：`http://<ECS_IP>/docs`
- OpenAPI：`http://<ECS_IP>/openapi.json`
- API 示例：`http://<ECS_IP>/api/v1/auth/login`

> 绑定域名后，仅需将 `server_name _;` 改为你的域名，并增加 HTTPS 证书配置。

---

## 8. 备份与恢复

备份：

```bash
./scripts/backup.sh
```

恢复：

```bash
./scripts/restore.sh backups/crm_YYYY-MM-DD_HHMMSS.dump
```

建议：

- 每日定时备份（crontab）
- 备份文件同步到 OSS/异地对象存储
- 定期演练恢复，确保可用

---

## 9. 运行与排障

查看容器状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

常见问题：

1. **80 端口访问失败**：先检查安全组与 `nginx -t`。
2. **登录失败 401**：确认管理员已初始化（`./scripts/init.sh`）。
3. **后端启动失败**：检查 `.env` 中 `DATABASE_URL` 与数据库密码是否一致。
4. **跨域报错**：确认 `CORS_ORIGINS` 包含实际访问地址。
5. **`Unit docker.service does not exist`**：说明系统未安装 Docker Engine（仅装了 docker 客户端包）。执行：
   ```bash
   sudo dnf install -y dnf-plugins-core
   sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo systemctl enable --now docker
   docker info
   docker compose version
   ```
6. **`docker` 提示 `Emulate Docker CLI using podman` / `looking up compose provider failed`**：说明当前是 podman 兼容层，不是 Docker Engine。执行：
   ```bash
   sudo dnf remove -y podman-docker docker docker-client docker-common podman buildah || true
   sudo dnf install -y dnf-plugins-core
   sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   sudo dnf install -y --allowerasing docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo systemctl enable --now docker
   docker info
   docker compose version
   ```
7. **Nginx 警告 `conflicting server name "_"`**：表示 80 端口存在多个默认站点配置。删除多余配置后重载：
   ```bash
   sudo ls /etc/nginx/conf.d/
   sudo rm -f /etc/nginx/conf.d/default.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

## 10. 非 Docker 部署（可选简略）

> 仅作为应急方案，生产仍推荐 Docker。

1. 安装 PostgreSQL、Python 3.10+、Node.js 18+、Nginx。
2. 后端安装依赖并运行：`uvicorn app.main:app --host 0.0.0.0 --port 8000`。
3. 前端 `npm run build` 后由 Nginx 托管静态文件。
4. 按本文件第 7 节配置 Nginx 反向代理 `/api` 到 8000。

