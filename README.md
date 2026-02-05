# dongpeng-crm

东鹏瓷砖 CRM（MVP）代码仓库。

## 快速启动（Docker）

```bash
cp .env.example .env
docker compose up -d --build
```

访问：
- 前端：`http://<服务器IP>:3000`
- 后端 Swagger：`http://<服务器IP>:8000/docs`
- 健康检查：`http://<服务器IP>:8000/health`

## 一键上线（Ubuntu 22.04 推荐，root 路径服务器）

```bash
sudo bash scripts/one_click_up.sh
# 可指定目录/IP
# sudo PROJECT_DIR=/root/dongpeng-crm ECS_IP=<服务器公网IP> bash scripts/one_click_up.sh
```


## 中国网络环境构建加速（已内置）

项目已默认启用中国大陆镜像构建参数：
- Debian APT：`mirrors.aliyun.com`
- PyPI：`https://pypi.tuna.tsinghua.edu.cn/simple`
- npm：`https://registry.npmmirror.com`

如需替换镜像，修改 `.env` 中对应变量后重新构建：

```bash
docker compose build --no-cache
docker compose up -d
```

## 一键初始化（迁移 + 管理员）

```bash
./scripts/init.sh
```

系统会确保存在默认管理员：
- 用户名：`admin`
- 密码：`Admin@12345`
- 首次登录强制改密：`force_change_password=true`

## 备份与恢复

```bash
./scripts/backup.sh
./scripts/restore.sh backups/crm_xxx.dump
```

## 上线前自检（Preflight）

```bash
./scripts/preflight.sh
```

## 目录亮点

- `backend/` FastAPI + SQLAlchemy + JWT
- `frontend/` React + Ant Design
- `backend/migrations/sql/0001_init.sql` 数据库初始化 SQL
- `scripts/` 初始化、备份、恢复脚本
- `scripts/one_click_up.sh` ECS 一键上线脚本（Ubuntu 22.04 优先；安装依赖/启动/初始化/Nginx/自检，含 Docker Hub 超时自动重试）
- `scripts/preflight.sh` 上线前快速自检（文件/命令/测试/安全基线）
- `docs/deploy-ecs.md` ECS 部署说明
- `deploy/nginx/default.conf` IP 访问反代配置
- `docs/release-readiness.md` 上线就绪评估与整改清单

## 当前已实现（持续扩展，已补齐基础 RBAC 与统一错误码）

- 登录鉴权（JWT）
- 用户、线索、客户、看板基础 API
- 客户合并（基础版）
- 审计日志基础落表
- 角色初始化（超级管理员/店长/销售/设计师/单证/仓库/售后）
- 前端管理壳（左侧菜单 + 顶部用户信息）



## 新增补齐

- 统一错误码与异常处理（1001/1003/2001/2002/2003/5000）
- 基础 RBAC（角色-权限点）与 `/api/v1/auth/me` 权限返回
- 演示数据脚本：`scripts/seed_demo.py`（`ENABLE_DEMO_DATA=true` 生效）
- 管理员创建脚本：`scripts/create-admin.py`


## 新增业务 API（MVP 骨架）

- 量尺：`/api/v1/measures`
- 报价：`/api/v1/quotes`
- 订单：`/api/v1/orders`、`/api/v1/orders/arrears`
- 售后：`/api/v1/tickets`
- 回访：`/api/v1/visits`
- 导入：`POST /api/v1/imports/leads`（CSV）
- 导出：`/api/v1/exports/leads|customers|orders|tickets`
