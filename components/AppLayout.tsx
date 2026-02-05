"use client";

import {
  BarChartOutlined,
  FileAddOutlined,
  ProfileOutlined,
  ScheduleOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import { usePathname, useRouter } from "next/navigation";

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: "/dashboard", icon: <BarChartOutlined />, label: "数据看板" },
  { key: "/customers", icon: <TeamOutlined />, label: "客户列表" },
  { key: "/customers/new", icon: <FileAddOutlined />, label: "新增客户" },
  { key: "/todos", icon: <ScheduleOutlined />, label: "我的待办" }
];

export default function AppLayout({
  children,
  userName,
  userRole
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const onMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="light" style={{ borderRight: "1px solid #f0f0f0" }}>
        <div style={{ padding: 16 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            东鹏 CRM
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={onMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0"
          }}
        >
          <Typography.Text>
            当前用户：{userName}（{userRole}）
          </Typography.Text>
          <Button onClick={handleLogout}>退出登录</Button>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
