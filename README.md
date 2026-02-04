# 东鹏 CRM

信阳东鹏瓷砖客户管理系统（内网 MVP 版本）。

## 技术选型
- 前端：Next.js 14 + TypeScript
- UI：Ant Design 5
- 后端：Next.js API Routes
- 数据库：PostgreSQL
- ORM：Prisma
- 认证：账号密码 + JWT Cookie

## 主要功能
- 账号密码登录
- 客户列表（筛选：负责人、阶段、来源、类型、超期未跟进）
- 客户新增/编辑/详情/阶段管理
- 跟进记录时间线 + 新增跟进（自动更新下次联系时间）
- 客户归属转移（MANAGER / OWNER）
- 数据看板（今日新增、今日跟进、阶段分布）
- 我的待办（超期或到期跟进）

## 初始化管理员账号
1. 配置环境变量（见 `.env.example`）。
2. 执行 Prisma migration 后运行 seed：

```bash
npm run prisma:migrate
npm run seed
```

默认管理员账号：
- 用户名：`admin`
- 密码：`Admin123!`

可通过环境变量覆盖：
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## 本地启动步骤
```bash
cp .env.example .env
# 修改 DATABASE_URL / JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```
访问：http://localhost:3000

## 服务器部署（内网）
1. 准备 PostgreSQL 数据库并创建库。
2. 拷贝代码到服务器，配置 `.env`。
3. 安装依赖并构建：

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run build
npm run start
```

建议使用进程管理器（如 PM2）或系统服务守护进程。

### 无域名，仅 IP 访问（Linux）
如果当前还没有域名，可以直接用服务器公网/内网 IP 访问。

1. 修改 `.env` 中 `DATABASE_URL` 为云数据库连接串，并确认数据库白名单已放行服务器 IP。【F:README.md†L67-L69】
2. 启动服务：

```bash
PORT=3000 npm run start
```

3. 在云服务器安全组/防火墙中放行端口（例如 3000）。
4. 浏览器访问：`http://47.110.83.150:3000`。

> 如果后续绑定域名，可再用 Nginx 反向代理到本服务端口。

## 修改数据库配置、端口、账号密码
- 数据库：修改 `.env` 中 `DATABASE_URL`。
- JWT 密钥：修改 `.env` 中 `JWT_SECRET`。
- 端口：默认 `3000`，可通过 `PORT=3001 npm run start`。
- 默认管理员账号：通过 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 设置后重新执行 `npm run seed`。

## 目录结构
```
app/                # App Router 页面与 API Routes
components/         # 通用组件（布局、表单等）
lib/                # 认证、权限、数据库工具
prisma/             # Prisma schema & seed
```
