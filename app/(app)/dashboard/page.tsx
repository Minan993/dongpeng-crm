"use client";

import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import { useEffect, useState } from "react";
import { getStatusLabel } from "@/lib/options";

type StatusGroup = { status: string; _count: { status: number } };

type DashboardData = {
  todayNewCustomers: number;
  todayFollowups: number;
  statusGroup: StatusGroup[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/dashboard");
      const payload = await response.json();
      setData(payload.data);
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: "阶段",
      dataIndex: "status",
      render: (value: string) => getStatusLabel(value as never)
    },
    {
      title: "客户数量",
      dataIndex: ["_count", "status"]
    }
  ];

  return (
    <div>
      <Typography.Title level={3}>数据看板</Typography.Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="今日新增客户" value={data?.todayNewCustomers ?? 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日跟进次数" value={data?.todayFollowups ?? 0} />
          </Card>
        </Col>
      </Row>
      <Card title="各阶段客户数量">
        <Table
          rowKey="status"
          columns={columns}
          dataSource={data?.statusGroup ?? []}
          pagination={false}
        />
      </Card>
    </div>
  );
}
