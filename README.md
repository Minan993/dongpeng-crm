# 导购产品价格查询系统（企业微信 H5）

## 功能
- 企业微信 OAuth 登录（`snsapi_base` 优先，失败回退 `snsapi_userinfo`）
- 导购查询：搜索、筛选、排序、分页
- 管理后台：产品 CRUD、Excel 导入导出、模板下载、版本复制、用户角色管理、操作日志
- PostgreSQL 持久化，Docker Compose 部署，Nginx HTTPS

## 企业微信后台配置
在企业微信管理后台应用配置以下内容：
1. **网页授权域名**：`dp1972.cn`
2. **可信域名**：`dp1972.cn`
3. **OAuth 回调 URL**：`https://dp1972.cn/auth/wecom/callback`
4. 应用可见范围需覆盖导购用户。

## 快速部署（Ubuntu 22.04）
```bash
cp .env.example .env
vim .env
bash scripts/deploy_ubuntu22_cn.sh
```
部署完成后访问：`https://dp1972.cn`

## 主要接口
- `GET /api/health`
- `GET /api/me`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/products/import`
- `GET /api/admin/products/export`
- `POST /api/admin/versions`
- `GET/POST /api/admin/users`
- `GET /api/admin/logs`
- `GET /auth/wecom/login`
- `GET /auth/wecom/callback`

## Excel 模板字段
`渠道归属, 产品型号, 产品名称, 产品规格, 版本, 主次, 5A/4A/常规, 价格, 控价, 政策, 备注`

导入规则：同版本下 `产品型号 + 产品规格 + 渠道归属` 唯一，存在更新，不存在新增，并记录 `change_logs(action=import)`。
