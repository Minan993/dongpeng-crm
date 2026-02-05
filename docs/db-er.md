# 东鹏瓷砖 CRM 数据库设计（第 2 部分）

> 目标：支持线索→沟通→量尺→报价→下单→交付→售后→回访的全链路数据闭环，满足权限、审计、报表统计与导入导出。

## 1. ER 关系说明（文字版）

- `store`（门店）1:N `department`（部门）
- `store` 1:N `user`（用户）
- `role` N:M `user`（通过 `user_role`）
- `permission` N:M `role`（通过 `role_permission`，含菜单与接口）
- `lead`（线索）可转化为 `customer`（客户），并有负责人 `owner_id -> user`
- `customer` 1:N `followup`
- `customer` 1:N `measure`
- `customer` 1:N `quote`
- `quote` 1:N `quote_item`
- `customer` 1:N `order`
- `order` 1:N `payment_node`
- `order` 1:N `delivery`
- `order` 1:N `install`
- `customer` 1:N `ticket`（售后工单）
- `ticket` 1:N `ticket_log`（处理记录）
- `customer` 1:N `visit`（回访）
- 关键业务实体（lead/customer/quote/order/ticket）均可关联 `audit_log`
- 附件统一存于 `file_asset`，可按 `biz_type + biz_id` 关联任意业务单据

## 2. 关键表字段设计（MVP）

> 字段命名采用 snake_case；所有主键使用 UUID；金额统一使用 `numeric(12,2)`；时间统一 `timestamptz`。

### 2.1 组织与权限

| 表名 | 关键字段 | 说明 |
|---|---|---|
| store | id, code, name, status, created_at | 门店 |
| department | id, store_id, name, parent_id, status | 部门，支持树状 |
| user | id, username, password_hash, real_name, mobile, store_id, dept_id, status, force_change_password, last_login_at | 系统用户 |
| role | id, code, name, data_scope, status | 角色（超级管理员/店长/销售/设计师/单证/仓库/售后） |
| permission | id, code, name, type(menu/api/button), path, method, parent_id | 权限点 |
| user_role | user_id, role_id | 用户角色关联 |
| role_permission | role_id, permission_id | 角色权限关联 |

### 2.2 客户与线索

| 表名 | 关键字段 | 说明 |
|---|---|---|
| lead | id, name, mobile, source, intent_category, budget_min, budget_max, city, district, community, area_m2, style_preference, stage, owner_id, next_followup_at, is_overdue, converted_customer_id, created_at | 线索主表 |
| customer | id, name, mobile, wechat, province, city, district, address, tags(jsonb), remark, store_id, sales_id, level, created_at | 客户主表（手机号唯一约束） |
| followup | id, customer_id, lead_id, followup_time, method, content, result, next_action, next_followup_at, creator_id | 跟进记录 |

### 2.3 量尺与方案

| 表名 | 关键字段 | 说明 |
|---|---|---|
| measure | id, customer_id, lead_id, appointment_time, onsite_time, house_type, area_m2, remeasure, plan_status, designer_id, status, remark | 量尺记录 |
| quote | id, quote_no, customer_id, measure_id, version_no, total_amount, discount_amount, final_amount, valid_until, approve_status, approver_id, approved_at, status | 报价主表 |
| quote_item | id, quote_id, sku, sku_name, spec, unit, qty, unit_price, discount_rate, line_amount, sort_no | 报价明细 |

### 2.4 订单与交付

| 表名 | 关键字段 | 说明 |
|---|---|---|
| order_info | id, order_no, customer_id, quote_id, signed_at, total_amount, deposit_amount, tail_amount, paid_amount, arrears_amount, invoice_title, invoice_tax_no, delivery_mode, delivery_address, status | 订单主表 |
| payment_node | id, order_id, node_name, due_date, amount, paid_amount, paid_at, status | 付款节点 |
| delivery | id, order_id, warehouse_out_at, logistics_company, tracking_no, driver_name, driver_mobile, scheduled_delivery_at, signed_at, signed_by, status | 发货配送 |
| install | id, order_id, scheduled_install_at, installer_name, installer_mobile, completed_at, acceptance_result, issue_record, status | 安装交付 |

### 2.5 售后与回访

| 表名 | 关键字段 | 说明 |
|---|---|---|
| ticket | id, ticket_no, customer_id, order_id, type, priority, description, status, responsibility, owner_id, created_at, closed_at | 售后工单 |
| ticket_log | id, ticket_id, action, content, operator_id, created_at | 工单流转记录 |
| visit | id, customer_id, order_id, visit_time, satisfaction_score, nps_score, comment, repurchase_intent, referral_intent, owner_id | 回访记录 |

### 2.6 审计与附件

| 表名 | 关键字段 | 说明 |
|---|---|---|
| audit_log | id, biz_type, biz_id, action, before_data(jsonb), after_data(jsonb), operator_id, operator_name, ip, user_agent, created_at | 审计日志 |
| operation_log | id, module, action, request_path, request_method, request_body, response_code, duration_ms, operator_id, created_at | 操作日志 |
| file_asset | id, biz_type, biz_id, file_name, file_path, file_size, mime_type, storage(local/oss), uploader_id, created_at | 附件元数据 |

## 3. 索引与约束设计（关键）

- 唯一约束
  - `user.username` 唯一
  - `customer.mobile` 唯一（用于客户合并去重）
  - `quote.quote_no`、`order_info.order_no`、`ticket.ticket_no` 唯一
- 常用查询索引
  - `lead(owner_id, stage, next_followup_at)`
  - `followup(customer_id, followup_time desc)`
  - `measure(designer_id, appointment_time)`
  - `order_info(customer_id, status, signed_at)`
  - `ticket(status, owner_id, created_at)`
  - `audit_log(biz_type, biz_id, created_at)`
- 统计类索引
  - `lead(created_at)`、`order_info(signed_at)`、`visit(visit_time)`
- 外键策略
  - 强业务关联采用 FK 约束；历史留痕实体（审计日志）不做级联删除。

## 4. 状态机建议（MVP）

- lead.stage: `new -> contacted -> measuring -> quoted -> won/lost`
- measure.status: `pending -> assigned -> onsite_done -> plan_done -> closed`
- quote.approve_status: `draft -> pending -> approved/rejected -> void`
- order_info.status: `draft -> confirmed -> delivering -> installed -> completed`
- ticket.status: `open -> processing -> waiting_customer -> resolved -> closed`

## 5. 备份与恢复（PostgreSQL 指令）

```bash
# 备份
pg_dump -h <host> -U <user> -d <db> -Fc -f backup_$(date +%F_%H%M).dump

# 恢复（先建库）
pg_restore -h <host> -U <user> -d <db> --clean --if-exists backup_xxx.dump
```

