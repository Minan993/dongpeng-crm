"use client";

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Select,
  Space,
  Timeline,
  Typography,
  message
} from "antd";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  followupMethodOptions,
  getFollowupMethodLabel,
  getSourceLabel,
  getStatusLabel,
  getTypeLabel,
  sourceOptions,
  statusOptions,
  typeOptions
} from "@/lib/options";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short"
});

type User = { id: string; name: string; role: string };

type Followup = {
  id: string;
  method: string;
  content: string;
  nextContactAt: string | null;
  createdAt: string;
  user: { id: string; name: string };
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  wechat: string | null;
  address: string | null;
  community: string | null;
  source: string;
  type: string;
  tags: string[];
  status: string;
  owner: User;
  nextContactAt: string | null;
  lastFollowupAt: string | null;
  followups: Followup[];
};

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [followupForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  const loadData = async () => {
    const response = await fetch(`/api/customers/${id}`);
    if (!response.ok) {
      messageApi.error("无法加载客户");
      return;
    }
    const payload = await response.json();
    setCustomer(payload.data);
    form.setFieldsValue({
      name: payload.data.name,
      phone: payload.data.phone,
      wechat: payload.data.wechat,
      address: payload.data.address,
      community: payload.data.community,
      source: payload.data.source,
      type: payload.data.type,
      status: payload.data.status,
      tags: payload.data.tags.join(",")
    });
  };

  useEffect(() => {
    loadData();
    fetch("/api/users")
      .then((res) => res.json())
      .then((payload) => setUsers(payload.data));
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => setRole(payload.data.role));
  }, [id]);

  const handleUpdate = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      tags: values.tags ? values.tags.split(/\s*,\s*/).filter(Boolean) : []
    };
    const response = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      messageApi.error("更新失败");
      return;
    }
    messageApi.success("更新成功");
    await loadData();
  };

  const handleFollowup = async () => {
    const values = await followupForm.validateFields();
    const response = await fetch(`/api/customers/${id}/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      messageApi.error("新增跟进失败");
      return;
    }
    followupForm.resetFields();
    messageApi.success("跟进已记录");
    await loadData();
  };

  const handleTransfer = async () => {
    const values = await transferForm.validateFields();
    const response = await fetch(`/api/customers/${id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      messageApi.error("转移失败");
      return;
    }
    transferForm.resetFields();
    messageApi.success("归属已转移");
    await loadData();
  };

  if (!customer) {
    return null;
  }

  return (
    <div>
      {contextHolder}
      <Typography.Title level={3}>客户详情</Typography.Title>
      <Card title="基础信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="客户">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="电话">{customer.phone}</Descriptions.Item>
          <Descriptions.Item label="微信">{customer.wechat || "-"}</Descriptions.Item>
          <Descriptions.Item label="地址">{customer.address || "-"}</Descriptions.Item>
          <Descriptions.Item label="小区">{customer.community || "-"}</Descriptions.Item>
          <Descriptions.Item label="来源">{getSourceLabel(customer.source as never)}</Descriptions.Item>
          <Descriptions.Item label="类型">{getTypeLabel(customer.type as never)}</Descriptions.Item>
          <Descriptions.Item label="阶段">{getStatusLabel(customer.status as never)}</Descriptions.Item>
          <Descriptions.Item label="负责人">{customer.owner.name}</Descriptions.Item>
          <Descriptions.Item label="标签">
            {customer.tags.length ? customer.tags.join(", ") : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="编辑客户" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="电话" name="phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="微信" name="wechat">
            <Input />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="小区" name="community">
            <Input />
          </Form.Item>
          <Form.Item label="客户来源" name="source" rules={[{ required: true }]}>
            <Select options={sourceOptions} />
          </Form.Item>
          <Form.Item label="客户类型" name="type" rules={[{ required: true }]}>
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item label="标签（逗号分隔）" name="tags">
            <Input />
          </Form.Item>
          <Form.Item label="阶段" name="status" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Button type="primary" onClick={handleUpdate}>
            保存修改
          </Button>
        </Form>
      </Card>

      {role && role !== "SALES" ? (
        <Card title="转移归属" style={{ marginBottom: 16 }}>
          <Form form={transferForm} layout="inline">
            <Form.Item
              label="新的负责人"
              name="ownerUserId"
              rules={[{ required: true, message: "请选择销售" }]}
            >
              <Select style={{ minWidth: 200 }} placeholder="选择销售">
                {users.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Button type="primary" onClick={handleTransfer}>
              转移
            </Button>
          </Form>
        </Card>
      ) : null}

      <Card title="新增跟进" style={{ marginBottom: 16 }}>
        <Form form={followupForm} layout="vertical">
          <Form.Item label="跟进方式" name="method" rules={[{ required: true }]}>
            <Select options={followupMethodOptions} />
          </Form.Item>
          <Form.Item label="跟进内容" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="下次联系时间" name="nextContactAt">
            <Input type="datetime-local" />
          </Form.Item>
          <Button type="primary" onClick={handleFollowup}>
            保存跟进
          </Button>
        </Form>
      </Card>

      <Card title="跟进记录">
        <Timeline
          items={customer.followups.map((followup) => ({
            color: "blue",
            children: (
              <div>
                <Space direction="vertical">
                  <Typography.Text>
                    {getFollowupMethodLabel(followup.method as never)} - {followup.user.name}
                  </Typography.Text>
                  <Typography.Text>{followup.content}</Typography.Text>
                  <Typography.Text type="secondary">
                    {dateFormatter.format(new Date(followup.createdAt))}
                    {followup.nextContactAt
                      ? ` | 下次联系：${dateFormatter.format(new Date(followup.nextContactAt))}`
                      : ""}
                  </Typography.Text>
                </Space>
              </div>
            )
          }))}
        />
      </Card>
    </div>
  );
}
