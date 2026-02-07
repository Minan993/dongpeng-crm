# 东鹏瓷砖客户需求表（H5 + 管理后台）

可上线使用的移动端优先系统，包含：
- H5 客户表单：`/`
- 管理后台：`/admin`
- API：`/api/*`

> 默认管理员：`admin / 123`（仅满足当前需求，上线后请改）。

## 技术栈
- 前端：React + Vite（移动端优先）
- 后端：Express + PostgreSQL
- 反代：Nginx
- 部署：Docker Compose

## 一键部署（Ubuntu 22.04，中国国内）
```bash
bash scripts/deploy_ubuntu22_cn.sh
```

脚本会自动完成：
1. 检测并安装 Docker / Compose
2. 配置 Docker 镜像加速（默认 `https://docker.m.daocloud.io`，可通过 `DOCKER_MIRROR` 覆盖）
3. 生成 `.env`（随机 DB 密码和 JWT secret）
4. `docker compose build && docker compose up -d`
5. 健康检查：`curl http://127.0.0.1/api/health`
6. 打印公网访问地址

## 常用命令
```bash
docker compose ps
docker compose logs -f
docker compose restart
```

## 开放端口
```bash
sudo ufw allow 80/tcp
```

## 升级
```bash
git pull
bash scripts/deploy_ubuntu22_cn.sh
```

## 数据备份/恢复
### 备份
```bash
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > backup.sql
```

### 恢复
```bash
cat backup.sql | docker compose exec -T db psql -U "$DB_USER" "$DB_NAME"
```

## 故障排查
1. **拉镜像失败**：
   - 检查 DNS/网络连通性
   - 更换加速地址：
     ```bash
     DOCKER_MIRROR=https://your-mirror.example.com bash scripts/deploy_ubuntu22_cn.sh
     ```
2. **80 端口占用**：
   ```bash
   sudo ss -lntp | rg ':80'
   ```
3. **服务启动异常**：
   ```bash
   docker compose logs -f nginx web api db
   ```

## API 概览
- `GET /api/health`
- `POST /api/leads`
- `POST /api/auth/login`
- `GET /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id`
- `POST /api/leads/:id/notes`
- `GET /api/export?format=csv`

## 说明
- 时区默认 `Asia/Shanghai`
- 数据库存储 `TIMESTAMPTZ`（UTC 兼容），前端按上海时区展示
- 导购名单示例在 `config/staff.json`，可按门店扩展
