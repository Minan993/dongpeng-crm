# 信阳东鹏瓷砖 H5 客户需求填写系统

## 技术栈
- 前端：Vite + React + TailwindCSS（移动端 Apple 风格）
- 后端：Express + SQLite + JWT + bcrypt
- 导出：ExcelJS

## 快速启动
```bash
npm install
cp .env.example .env
npm run init-db
npm run dev
```
- 前台 H5：`http://<IP>:5173/`
- 后台：`http://<IP>:5173/admin/login`
- 默认账号：`admin / Admin@123`

## 生产部署（Linux）
```bash
npm install
cp .env.example .env
npm run init-db
npm run build
npm run start
```
服务默认监听 `0.0.0.0:3000`，可在 `.env` 修改 `PORT`。

## Nginx 反向代理（可选）
```nginx
server {
  listen 80;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## Docker Compose
```bash
docker compose up -d
```

## API 概览
- `POST /api/public/lead` 提交需求
- `GET /api/admin/leads` 列表筛选分页
- `GET /api/admin/leads/:id` 详情
- `PATCH /api/admin/leads/:id` 更新状态
- `POST /api/admin/leads/:id/followups` 添加跟进
- `GET /api/admin/export` 导出 xlsx

## 功能说明
- 多步骤表单、进度条、草稿保存（localStorage）
- 自动生成需求编号：`DP-YYYYMMDD-0001`
- 后台登录鉴权（JWT）与提交限流
- 手机号在列表默认脱敏显示
