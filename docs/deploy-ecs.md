# Alibaba Cloud Linux 3.2 部署指南（第 7/8 部分骨架）

## 1. 开放端口（安全组/防火墙）

- 22/tcp：SSH
- 3000/tcp：前端
- 8000/tcp：后端 API / Swagger
- 80/tcp：如使用宿主机 Nginx 反向代理

> PostgreSQL `5432` 不建议公网放行（仅容器内网络使用）。

## 2. Docker 部署

```bash
git clone <your-repo>
cd dongpeng-crm
cp .env.example .env
docker compose up -d --build
```

访问：
- 前端：`http://<ECS_IP>:3000`
- 后端 Swagger：`http://<ECS_IP>:8000/docs`

## 3. 初始化（可重复执行）

```bash
./scripts/init.sh
```

## 3.1 上线前自检（建议）

```bash
./scripts/preflight.sh
```

> 若出现 `SECRET_KEY` 默认值或 `CORS_ORIGINS=*`，请先修正 `.env` 再上线。

## 4. 备份恢复

```bash
./scripts/backup.sh
./scripts/restore.sh backups/crm_xxx.dump
```

## 5. 无域名 Nginx 反代

- 配置文件：`deploy/nginx/default.conf`
- 可直接 `server_name _;` 支持 IP 访问。

## 6. 日志位置

- 容器日志：`docker compose logs -f backend`
- 前端日志：`docker compose logs -f frontend`
- 数据库日志：`docker compose logs -f db`

