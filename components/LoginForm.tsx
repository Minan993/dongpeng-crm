"use client";

import { Button, Card, Form, Input, message, Typography } from "antd";
import { useRouter } from "next/navigation";

async function safeReadMessage(response: Response) {
  const text = await response.text();
  if (!text) {
    return "登录失败，请稍后再试";
  }

  try {
    const data = JSON.parse(text) as { message?: string };
    return data.message || "登录失败，请稍后再试";
  } catch {
    return "登录失败，请稍后再试";
  }
}

export default function LoginForm() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: { username: string; password: string }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const errorMessage = await safeReadMessage(response);
      messageApi.error(errorMessage);
      return;
    }

    messageApi.success("登录成功");
    router.push("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0f5ff, #fff)"
      }}
    >
      {contextHolder}
      <Card style={{ width: 360, borderRadius: 16 }}>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          东鹏 CRM 登录
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="账号"
            name="username"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input placeholder="账号" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
