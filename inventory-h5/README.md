# inventory-h5 库存查询系统

一个可直接上线的库存查询系统（访客查询 + 管理后台），默认运行在 **8000 端口**，不会占用你已有的 80/443。

## 一键部署（Ubuntu 22.04 国内网络）

```bash
cd inventory-h5 && bash scripts/deploy_ubuntu22_cn.sh
```

脚本会自动完成：
- 安装 Docker / Compose（未安装时）
- 配置 Docker 国内镜像加速
- 构建阶段使用 npm 国内源
- `docker compose up -d --build`
- 健康检查并输出访问地址

> 管理员默认账号：`admin / 123`

## 验收地址

- 前台：`http://<公网IP>:8000/`
- 管理台：`http://<公网IP>:8000/admin`
- 健康检查：`http://<公网IP>:8000/api/health`

## 常用运维命令

```bash
# 查看容器状态
cd inventory-h5 && docker compose ps

# 查看日志
cd inventory-h5 && docker compose logs -f nginx api web db

# 重启服务
cd inventory-h5 && docker compose restart

# 更新代码并重部署
cd inventory-h5 && bash scripts/update_and_deploy.sh
```

## 数据库备份与恢复

```bash
# 备份
cd inventory-h5
docker compose exec -T db pg_dump -U ${POSTGRES_USER:-inventory} ${POSTGRES_DB:-inventory} > backup.sql

# 恢复
cd inventory-h5
cat backup.sql | docker compose exec -T db psql -U ${POSTGRES_USER:-inventory} -d ${POSTGRES_DB:-inventory}
```

## 常见故障排查

### 1) 出现 502
- 确认容器健康状态：`docker compose ps`
- 确认 `api` 为 `healthy`，`web` 为 `running`
- 本项目 nginx 已使用 Docker DNS 运行时解析（`resolver 127.0.0.11` + 变量 `proxy_pass`）

### 2) 健康检查不通过
- 查看 API 日志：`docker compose logs -f api`
- 查看数据库日志：`docker compose logs -f db`
- 检查 `.env` 中数据库账号密码是否一致

- 说明：`web` 服务不设置容器健康检查，避免在部分环境中被误判 `unhealthy`，由 `nginx` 直接反代其 4173 端口。

### 3) 端口被占用
- 本项目固定占用宿主机 `8000`
- 查看占用：`sudo lsof -i :8000`
- 释放占用后重启：`docker compose up -d`

## 字段说明
- model（型号，必填，唯一）
- name（名称，必填）
- brand（品牌，可选）
- spec（规格，可选）
- batch（批次，可选）
- qty（库存数量，整数 >= 0）
- remark（备注，可选）
- created_at / updated_at（后台可见）

## API 概览
- `GET /api/health`
- `GET /api/items?keyword=xxx&page=1&pageSize=20`
- `GET /api/items/:id`
- `POST /api/auth/login`
- `POST /api/admin/items`
- `PUT /api/admin/items/:id`
- `DELETE /api/admin/items/:id`
- `POST /api/admin/items/import`
- `GET /api/admin/items/export?keyword=xxx`
