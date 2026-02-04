import { CustomerSource, CustomerStatus, CustomerType, FollowupMethod } from "@prisma/client";

export const statusOptions = [
  { value: CustomerStatus.LEAD, label: "留资" },
  { value: CustomerStatus.APPOINTMENT, label: "预约到店" },
  { value: CustomerStatus.VISIT, label: "已到店" },
  { value: CustomerStatus.MEASURE, label: "已量尺/量房" },
  { value: CustomerStatus.QUOTE, label: "已报价/出方案" },
  { value: CustomerStatus.DEPOSIT, label: "已交定金" },
  { value: CustomerStatus.ORDER, label: "已下单" },
  { value: CustomerStatus.DELIVERY, label: "已发货/安装" },
  { value: CustomerStatus.AFTERSALES, label: "售后/维护中" },
  { value: CustomerStatus.LOST, label: "流失" }
];

export const sourceOptions = [
  { value: CustomerSource.DOUYIN, label: "抖音" },
  { value: CustomerSource.STORE, label: "门店" },
  { value: CustomerSource.REFERRAL, label: "老客户" },
  { value: CustomerSource.FOREMAN, label: "工长" },
  { value: CustomerSource.DECORATION, label: "装企" },
  { value: CustomerSource.EVENT, label: "活动" }
];

export const typeOptions = [
  { value: CustomerType.RETAIL, label: "零售" },
  { value: CustomerType.RENOVATION, label: "整装" },
  { value: CustomerType.PROJECT, label: "工程" }
];

export const followupMethodOptions = [
  { value: FollowupMethod.PHONE, label: "电话" },
  { value: FollowupMethod.WECHAT, label: "微信" },
  { value: FollowupMethod.VISIT, label: "到店" }
];

export function getStatusLabel(value: CustomerStatus) {
  return statusOptions.find((item) => item.value === value)?.label ?? value;
}

export function getSourceLabel(value: CustomerSource) {
  return sourceOptions.find((item) => item.value === value)?.label ?? value;
}

export function getTypeLabel(value: CustomerType) {
  return typeOptions.find((item) => item.value === value)?.label ?? value;
}

export function getFollowupMethodLabel(value: FollowupMethod) {
  return followupMethodOptions.find((item) => item.value === value)?.label ?? value;
}
