"use client";

import { Button, Card, Form, Select, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSourceLabel, getStatusLabel, getTypeLabel, sourceOptions, statusOptions, typeOptions } from "@/lib/options";

type User = { id: string; name: string; role: string };

type Customer = {
  id: string;
  name: string;
  phone: string;
  source: string;
  type: string;
  status: string;
  owner: User;
  nextContactAt: string | null;
};

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form] = Form.useForm();

  const fetchCustomers = async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params ?? {}).toString();
    const response = await fetch(`/api/customers?${query}`);
    const payload = await response.json();
    setData(payload.data);
  };

  useEffect(() => {
    fetchCustomers();
    fetch("/api/users")
      .then((res) => res.json())
      .then((payload) => setUsers(payload.data));
  }, []);

  const onSearch = async () => {
    const values = await form.validateFields();
    const params: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    await fetchCustomers(params);
  };

  const onReset = async () => {
    form.resetFields();
    await fetchCustomers();
  };

  const columns = [
    {
      title: "客户",
      dataIndex: "name",
      render: (_: string, record: Customer) => (
        <Link href={`/customers/${record.id}`}>{record.name}</Link>
      )
    },
    { title: "电话", dataIndex: "phone" },
    {
      title: "来源",
      dataIndex: "source",
      render: (value: string) => getSourceLabel(value as never)
    },
    {
      title: "类型",
      dataIndex: "type",
      render: (value: string) => getTypeLabel(value as never)
    },
    {
      title: "阶段",
      dataIndex: "status",
      render: (value: string) => <Tag color="blue">{getStatusLabel(value as never)}</Tag>
    },
    {
      title: "负责人",
      dataIndex: ["owner", "name"]
    },
    {
      title: "下次联系",
      dataIndex: "nextContactAt",
      render: (value: string | null) => (value ? new Date(value).toLocaleDateString() : "-")
    }
  ];

  return (
    <div>
      <Typography.Title level={3}>客户列表</Typography.Title>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="ownerUserId" label="负责人">
            <Select allowClear placeholder="全部" style={{ width: 160 }}>
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="阶段">
            <Select allowClear placeholder="全部" style={{ width: 160 }}>
              {statusOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select allowClear placeholder="全部" style={{ width: 160 }}>
              {sourceOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select allowClear placeholder="全部" style={{ width: 160 }}>
              {typeOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="overdue" label="超期未跟进">
            <Select allowClear placeholder="全部" style={{ width: 140 }}>
              <Select.Option value="true">是</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={onSearch}>
                筛选
              </Button>
              <Button onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={data} />
      </Card>
    </div>
  );
}
