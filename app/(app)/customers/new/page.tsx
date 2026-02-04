"use client";

import { Button, Card, Form, Input, Select, Space, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { sourceOptions, statusOptions, typeOptions } from "@/lib/options";

export default function NewCustomerPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: any) => {
    const payload = {
      ...values,
      tags: values.tags ? values.tags.split(/\s*,\s*/).filter(Boolean) : []
    };
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      messageApi.error("创建失败");
      return;
    }

    const data = await response.json();
    messageApi.success("创建成功");
    router.push(`/customers/${data.data.id}`);
  };

  return (
    <div>
      {contextHolder}
      <Typography.Title level={3}>新增客户</Typography.Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
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
            <Input placeholder="例如：重点客户,别墅" />
          </Form.Item>
          <Form.Item label="当前阶段" name="status" rules={[{ required: true }]}
          >
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => router.back()}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
