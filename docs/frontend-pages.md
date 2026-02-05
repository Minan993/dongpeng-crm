# 东鹏瓷砖 CRM 前端页面清单（第 4 部分）

> 技术栈：React + TypeScript + Ant Design + React Router + TanStack Query  
> 设计目标：苹果官网风格（简洁留白、轻阴影、浅灰分层）、后台高可用、权限精细化控制。  
> 页面基座：左侧菜单 + 顶部用户信息 + 面包屑 + 内容区。

---

## 1. 路由总览（按模块）

| 一级菜单 | 路由 | 页面组件 | 权限码（示例） | 说明 |
|---|---|---|---|---|
| 登录 | `/login` | `pages/auth/LoginPage.tsx` | `public` | 用户登录 |
| 强制改密 | `/force-change-password` | `pages/auth/ForceChangePasswordPage.tsx` | `auth.change_password` | 首登强制改密 |
| 工作台 | `/dashboard` | `pages/dashboard/DashboardPage.tsx` | `dashboard.view` | 漏斗/排行/预警卡片 |
| 系统-用户 | `/system/users` | `pages/system/UserPage.tsx` | `user.view` | 用户增删改查/启停用/重置密码 |
| 系统-角色 | `/system/roles` | `pages/system/RolePage.tsx` | `role.view` | 角色管理 |
| 系统-权限 | `/system/perms` | `pages/system/MenuPermPage.tsx` | `perm.view` | 菜单与接口权限分配 |
| 线索列表 | `/leads` | `pages/lead/LeadListPage.tsx` | `lead.view` | 线索筛选/分配/阶段推进 |
| 线索详情 | `/leads/:id` | `pages/lead/LeadDetailPage.tsx` | `lead.view` | 详情+跟进时间线 |
| 线索导入 | `/leads/import` | `pages/lead/LeadImportPage.tsx` | `lead.import` | 模板下载+批量导入 |
| 客户列表 | `/customers` | `pages/customer/CustomerListPage.tsx` | `customer.view` | 客户分页/标签筛选 |
| 客户详情360 | `/customers/:id` | `pages/customer/CustomerDetailPage.tsx` | `customer.view` | Tab：基本/跟进/订单/售后/日志 |
| 客户合并 | `/customers/merge` | `pages/customer/CustomerMergePage.tsx` | `customer.merge` | 同手机号合并 |
| 跟进列表 | `/followups` | `pages/followup/FollowupListPage.tsx` | `followup.view` | 快捷记录 |
| 超期跟进 | `/followups/overdue` | `pages/followup/OverdueFollowupPage.tsx` | `followup.overdue` | 超期提醒 |
| 量尺列表 | `/measures` | `pages/measure/MeasureListPage.tsx` | `measure.view` | 预约/派工/状态流转 |
| 量尺日历 | `/measures/calendar` | `pages/measure/MeasureCalendarPage.tsx` | `measure.view` | 按天/周排班 |
| 报价列表 | `/quotes` | `pages/quote/QuoteListPage.tsx` | `quote.view` | 报价版本管理 |
| 报价编辑 | `/quotes/:id/edit` | `pages/quote/QuoteEditPage.tsx` | `quote.edit` | 明细行编辑 |
| 报价审批 | `/quotes/approve` | `pages/quote/QuoteApprovePage.tsx` | `quote.approve` | 店长审批 |
| 订单列表 | `/orders` | `pages/order/OrderListPage.tsx` | `order.view` | 订单筛选 |
| 订单详情 | `/orders/:id` | `pages/order/OrderDetailPage.tsx` | `order.view` | 金额、节点、履约状态 |
| 欠款列表 | `/orders/arrears` | `pages/order/ArrearsPage.tsx` | `order.arrears` | 欠款预警 |
| 配送列表 | `/deliveries` | `pages/delivery/DeliveryListPage.tsx` | `delivery.view` | 物流签收 |
| 安装列表 | `/installs` | `pages/install/InstallListPage.tsx` | `install.view` | 完工验收 |
| 售后列表 | `/tickets` | `pages/ticket/TicketListPage.tsx` | `ticket.view` | 工单流转 |
| 售后详情 | `/tickets/:id` | `pages/ticket/TicketDetailPage.tsx` | `ticket.view` | 处理记录+附件 |
| 回访列表 | `/visits` | `pages/visit/VisitListPage.tsx` | `visit.view` | 满意度/NPS |
| 月报 | `/reports/monthly` | `pages/report/MonthlyReportPage.tsx` | `report.monthly` | 按月汇总 |
| 渠道报表 | `/reports/channel` | `pages/report/ChannelReportPage.tsx` | `report.channel` | 按渠道汇总 |

---

## 2. 布局与公共组件

### 2.1 主布局

- `components/layout/AppLayout.tsx`
  - 负责左侧导航、顶部用户区、面包屑、内容容器。
- `components/layout/Sidebar.tsx`
  - 动态菜单渲染（基于后端返回 menu permissions）。
- `components/layout/HeaderBar.tsx`
  - 显示用户、门店、角色、退出按钮。

### 2.2 通用业务组件

- `components/common/SearchForm.tsx`
  - 列表页统一搜索区，支持关键字 + 高级筛选折叠。
- `components/common/DataTable.tsx`
  - 统一分页表格（分页/排序/列配置/空态）。
- `components/common/PermissionButton.tsx`
  - 按按钮权限码控制显示，如 `lead.assign`。
- `components/common/UploadDragger.tsx`
  - 封装上传（大小、类型、错误提示、进度）。

### 2.3 图表组件

- `components/charts/FunnelChart.tsx`：转化漏斗
- `components/charts/RankBarChart.tsx`：销售排行
- `components/charts/TrendLineChart.tsx`：趋势折线

---

## 3. 页面功能清单（关键交互）

### 3.1 线索页（`/leads`）

- 搜索筛选：来源、阶段、负责人、门店、下次跟进时间区间。
- 列表操作：新增、编辑、分配、阶段推进、转客户、导出。
- 批量操作：批量分配、批量打标签、批量导出。
- 权限点：`lead.create` / `lead.assign` / `lead.stage` / `lead.export`。

### 3.2 客户 360 页（`/customers/:id`）

Tab 结构：
1. 基本信息（客户主档 + 标签 + 归属）
2. 跟进记录（时间线）
3. 订单记录（金额、节点、状态）
4. 售后记录（工单状态、处理人）
5. 审计日志（关键操作留痕）

### 3.3 报价编辑页（`/quotes/:id/edit`）

- 报价头信息：客户、有效期、版本号。
- 明细行：SKU/规格/数量/单价/折扣，自动汇总总价。
- 行内校验：数量 > 0、单价 >= 0、折扣范围 0~100。
- 操作按钮：保存草稿、提交审批、复制版本、作废。

### 3.4 订单详情页（`/orders/:id`）

- 订单金额区：定金/尾款/已付/欠款。
- 付款节点区：到期日、应收、实收、状态。
- 履约区：发货信息 + 安装信息。
- 开票区：抬头、税号、地址电话。

### 3.5 售后详情页（`/tickets/:id`）

- 工单基础：类型、优先级、责任判定、当前状态。
- 附件区：图片/PDF 上传与预览。
- 处理记录：时间线 + 状态流转。
- 权限点：`ticket.process` / `ticket.close` / `ticket.upload`。

---

## 4. 权限控制设计（菜单 + 按钮 + 接口）

### 4.1 菜单权限

- 登录后调用 `/auth/me` 获取 `menus`。
- `Sidebar` 仅渲染当前用户允许菜单。
- 未授权路由自动重定向到 `403` 页面。

### 4.2 按钮权限

- 页面中的关键按钮必须包裹 `PermissionButton perm="xxx"`。
- 例如：
  - 线索分配按钮 `lead.assign`
  - 报价审批按钮 `quote.approve`
  - 工单关闭按钮 `ticket.close`

### 4.3 接口权限

- Axios 请求统一加 token。
- 后端二次鉴权（角色-权限点）。
- 前端仅作为展示裁剪，不替代后端权限。

---

## 5. 表单与列表统一规范

- 列表页必须支持：搜索、筛选、分页、排序、导出。
- 详情页必须支持：分区卡片 + 审计日志入口。
- 表单统一校验：
  - 手机号格式
  - 金额必须非负
  - 日期逻辑（预约时间不可早于当前时间，特殊情况可配置）
- 空数据态：给出操作引导（如“去新建线索”）。

---

## 6. 状态与数据流

- `store/auth.ts`
  - 保存 token、用户信息、权限列表。
- `router/guard.tsx`
  - 处理登录态校验、首登改密校验、路由权限校验。
- `api/client.ts`
  - 统一请求拦截（加 token）与响应拦截（401 处理）。
- `TanStack Query`
  - 管理列表缓存、详情缓存、失效刷新。

---

## 7. 角色默认可见菜单建议（MVP）

| 角色 | 默认菜单 |
|---|---|
| 超级管理员 | 全部菜单 |
| 店长 | 看板、线索、客户、量尺、报价审批、订单、售后、报表 |
| 销售 | 看板、线索、客户、跟进、报价、订单、回访 |
| 设计师 | 量尺、报价（查看/编辑）、安装（查看） |
| 单证 | 订单、发货、开票信息 |
| 仓库 | 发货、在途订单 |
| 售后 | 售后工单、回访 |

---

## 8. 页面可用性与视觉风格（苹果风格落地）

- 背景色：浅灰 (`#f5f5f7`) + 白色卡片。
- 卡片圆角：`12px`；阴影轻量（低对比）。
- 字体层级：标题 20/16，正文 14。
- 操作反馈：成功/失败 toast + 行内校验提示。
- 表格密度：默认中等，支持紧凑模式。

