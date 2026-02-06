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

---

## Ubuntu 22.04（国内环境）生产部署指南
> 适用于阿里云/腾讯云/华为云等国内服务器，重点解决 Node 与 npm 下载慢/403 问题。

### 1）安装基础依赖
```bash
sudo apt update
sudo apt install -y git curl nginx build-essential
```

### 2）安装 Node.js 20（推荐 nvm）
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
npm -v
```

### 3）配置 npm 国内镜像（关键）
```bash
npm config set registry https://registry.npmmirror.com
npm config get registry
```

### 4）拉取代码并安装
```bash
cd /opt
sudo git clone <你的仓库地址> dongpeng-crm
sudo chown -R $USER:$USER /opt/dongpeng-crm
cd /opt/dongpeng-crm
npm install
```

### 5）初始化环境与数据库
```bash
cp .env.example .env
# 按需修改 .env，至少替换 JWT_SECRET、ADMIN_PASSWORD_HASH
npm run init-db
```

> 生成后台密码哈希（示例）：
```bash
node -e "console.log(require('bcryptjs').hashSync('你的新密码',10))"
```
把输出写入 `.env` 的 `ADMIN_PASSWORD_HASH`。

### 6）构建并启动
```bash
npm run build
npm run start
```
默认监听 `0.0.0.0:3000`。

---

## 使用 PM2 守护进程（推荐）
```bash
npm i -g pm2
cd /opt/dongpeng-crm
pm2 start "npm run start" --name dongpeng-crm
pm2 save
pm2 startup
```

查看状态：
```bash
pm2 ls
pm2 logs dongpeng-crm
```

---

## Nginx 反向代理（80 端口）
创建 `/etc/nginx/sites-available/dongpeng-crm`：

```nginx
server {
  listen 80;
  server_name _;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

启用并重载：
```bash
sudo ln -sf /etc/nginx/sites-available/dongpeng-crm /etc/nginx/sites-enabled/dongpeng-crm
sudo nginx -t
sudo systemctl reload nginx
```

---

## 防火墙与云安全组
开放端口：
- `80`（Nginx）
- `443`（如后续上 HTTPS）
- `22`（SSH）

如果直接调试 Node，可临时开放 `3000`。

---

## Docker Compose（可选）
```bash
docker compose up -d
```

> 国内环境如拉镜像慢，可先配置 Docker 镜像加速器。

---

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

## 常见问题（国内服务器）
1. **`npm install` 403/超时**
   - 执行：`npm config set registry https://registry.npmmirror.com`
2. **服务能跑但外网打不开**
   - 检查云安全组与 UFW 是否放行 80 端口
3. **重启后服务没了**
   - 使用 PM2 并执行 `pm2 save` + `pm2 startup`
