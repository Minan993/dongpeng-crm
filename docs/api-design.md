# 东鹏瓷砖 CRM API 设计（第 3 部分）

> 基础路径：`/api/v1`  
> 鉴权方式：`Authorization: Bearer <JWT>`  
> 返回规范：统一 JSON 包装

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "request_id": "uuid"
}
```

- `code=0` 代表成功
- 非 0 为业务错误码（如：`1001` 未认证、`1003` 无权限、`2001` 参数校验失败）

---

## 1. 认证与账户（Auth）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/login` | 登录，返回 access_token/refresh_token |
| POST | `/auth/refresh` | 刷新 token |
| POST | `/auth/logout` | 退出登录（服务端拉黑 refresh token，可选） |
| POST | `/auth/change-password` | 修改密码 |
| GET | `/auth/me` | 当前登录用户信息（含角色、菜单权限） |

### 1.1 登录请求示例

```json
{
  "username": "admin",
  "password": "Admin@12345"
}
```

### 1.2 登录响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "access_token": "xxx",
    "refresh_token": "yyy",
    "token_type": "bearer",
    "expires_in": 7200,
    "force_change_password": true
  }
}
```

---

## 2. 组织、用户、角色、权限（System）

### 2.1 门店/部门

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/stores` | 门店列表 |
| POST | `/stores` | 新增门店 |
| PUT | `/stores/{id}` | 更新门店 |
| GET | `/departments/tree` | 部门树 |
| POST | `/departments` | 新增部门 |
| PUT | `/departments/{id}` | 更新部门 |

### 2.2 用户管理

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/users` | 用户分页查询（按门店/角色/状态） |
| POST | `/users` | 新增用户 |
| GET | `/users/{id}` | 用户详情 |
| PUT | `/users/{id}` | 更新用户 |
| PUT | `/users/{id}/status` | 启停用 |
| POST | `/users/{id}/reset-password` | 重置密码 |

### 2.3 角色与权限

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/roles` | 角色列表 |
| POST | `/roles` | 新建角色 |
| PUT | `/roles/{id}` | 更新角色 |
| GET | `/roles/{id}/permissions` | 角色权限 |
| PUT | `/roles/{id}/permissions` | 更新角色权限 |
| GET | `/permissions/tree` | 菜单+接口权限树 |

---

## 3. 线索（Leads）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/leads` | 线索分页/筛选/排序 |
| POST | `/leads` | 新增线索 |
| GET | `/leads/{id}` | 线索详情 |
| PUT | `/leads/{id}` | 编辑线索 |
| PUT | `/leads/{id}/assign` | 分配负责人 |
| PUT | `/leads/{id}/stage` | 阶段推进 |
| POST | `/leads/import` | CSV/Excel 导入 |
| GET | `/leads/export` | 导出 CSV |
| GET | `/leads/overdue` | 超期未跟进线索 |
| POST | `/leads/{id}/convert-customer` | 线索转客户 |

### 3.1 导入参数
- `file`: `multipart/form-data`
- `dry_run`: 是否试跑校验（true 仅返回错误不入库）

---

## 4. 客户与跟进（Customers / Followups）

### 4.1 客户

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/customers` | 客户分页查询 |
| POST | `/customers` | 新增客户 |
| GET | `/customers/{id}` | 客户详情 |
| PUT | `/customers/{id}` | 编辑客户 |
| POST | `/customers/merge` | 客户合并（手机号去重） |
| GET | `/customers/{id}/360` | 客户 360 视图 |
| GET | `/customers/export` | 客户导出 CSV |

### 4.2 跟进

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/followups` | 跟进记录列表 |
| POST | `/followups` | 新增跟进 |
| GET | `/followups/overdue` | 超期跟进列表 |
| PUT | `/followups/{id}` | 编辑跟进 |
| DELETE | `/followups/{id}` | 删除跟进（审计） |

---

## 5. 量尺与报价（Measures / Quotes）

### 5.1 量尺

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/measures` | 量尺分页查询 |
| POST | `/measures` | 新建量尺预约 |
| PUT | `/measures/{id}` | 更新量尺 |
| PUT | `/measures/{id}/assign-designer` | 指派设计师 |
| PUT | `/measures/{id}/status` | 状态流转 |
| GET | `/measures/export` | 导出 CSV |

### 5.2 报价

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/quotes` | 报价列表 |
| POST | `/quotes` | 新建报价版本 |
| POST | `/quotes/{id}/copy` | 复制版本 |
| GET | `/quotes/{id}` | 报价详情（含明细） |
| PUT | `/quotes/{id}` | 编辑报价 |
| PUT | `/quotes/{id}/submit-approve` | 提交审批 |
| PUT | `/quotes/{id}/approve` | 店长审批 |
| PUT | `/quotes/{id}/void` | 作废 |
| GET | `/quotes/{id}/export` | 导出报价（CSV/PDF预留） |

---

## 6. 订单、配送、安装（Orders / Deliveries / Installs）

### 6.1 订单

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/orders` | 订单分页查询 |
| POST | `/orders` | 新建订单（可关联报价） |
| GET | `/orders/{id}` | 订单详情 |
| PUT | `/orders/{id}` | 更新订单 |
| GET | `/orders/arrears` | 欠款订单列表 |
| PUT | `/orders/{id}/status` | 订单状态流转 |
| GET | `/orders/export` | 订单导出 CSV |

### 6.2 付款节点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/orders/{id}/payment-nodes` | 添加付款节点 |
| PUT | `/payment-nodes/{id}` | 修改付款节点 |
| PUT | `/payment-nodes/{id}/pay` | 登记回款 |

### 6.3 发货配送

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/deliveries` | 发货列表 |
| POST | `/deliveries` | 创建发货单 |
| PUT | `/deliveries/{id}` | 编辑发货信息 |
| PUT | `/deliveries/{id}/sign` | 签收确认 |

### 6.4 安装交付

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/installs` | 安装任务列表 |
| POST | `/installs` | 新建安装任务 |
| PUT | `/installs/{id}` | 编辑安装任务 |
| PUT | `/installs/{id}/complete` | 完工验收 |

---

## 7. 售后与回访（Tickets / Visits）

### 7.1 售后工单

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/tickets` | 工单分页查询 |
| POST | `/tickets` | 创建工单 |
| GET | `/tickets/{id}` | 工单详情 |
| PUT | `/tickets/{id}` | 编辑工单 |
| PUT | `/tickets/{id}/status` | 工单状态流转 |
| POST | `/tickets/{id}/logs` | 添加处理记录 |
| GET | `/tickets/export` | 工单导出 CSV |

### 7.2 回访

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/visits` | 回访记录列表 |
| POST | `/visits` | 新增回访 |
| PUT | `/visits/{id}` | 更新回访 |
| GET | `/visits/pending` | 未回访客户列表 |

---

## 8. 数据看板与报表（Dashboard / Reports）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/dashboard/overview` | 看板总览 |
| GET | `/dashboard/funnel` | 线索转化漏斗（线索→量尺→报价→下单） |
| GET | `/dashboard/sales-ranking` | 销售排行（销售/门店/月） |
| GET | `/dashboard/in-transit-orders` | 在途订单 |
| GET | `/dashboard/overdue-leads` | 超期未跟进线索 |
| GET | `/dashboard/unvisited-customers` | 未回访客户 |
| GET | `/reports/monthly` | 月报 |
| GET | `/reports/channel` | 渠道汇总报表 |

---

## 9. 导入导出、附件、日志

### 9.1 导入导出

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/templates/{module}` | 下载导入模板（lead/customer/order/ticket） |
| POST | `/imports/{module}` | 导入数据 |
| GET | `/exports/{module}` | 导出数据 |

### 9.2 附件上传

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/files/upload` | 上传附件（本地存储，OSS 预留） |
| GET | `/files/{id}` | 获取附件元数据 |
| GET | `/files/{id}/download` | 下载附件 |

> 上传限制建议（MVP）
- 单文件最大：`10MB`
- 允许类型：`jpg/png/pdf/xlsx/csv`
- 存储路径：`/data/uploads/<biz_type>/<yyyy-mm>/`

### 9.3 审计与操作日志

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/audit-logs` | 审计日志查询 |
| GET | `/operation-logs` | 接口操作日志查询 |

---

## 10. OpenAPI 与错误码约定

- Swagger UI：`/docs`
- OpenAPI JSON：`/openapi.json`
- 常见错误码：

| code | 含义 |
|---|---|
| 0 | 成功 |
| 1001 | 未登录/Token 无效 |
| 1002 | Token 过期 |
| 1003 | 无权限 |
| 2001 | 参数校验失败 |
| 2002 | 资源不存在 |
| 2003 | 资源冲突（如手机号重复） |
| 3001 | 业务状态不允许当前操作 |
| 5000 | 系统内部错误 |

