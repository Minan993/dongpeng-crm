"use client";

import { Card, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getStatusLabel } from "@/lib/options";

type TodoCustomer = {
  id: string;
  name: string;
  phone: string;
  status: string;
  nextContactAt: string | null;
  owner: { id: string; name: string };
};

export default function TodosPage() {
  const [data, setData] = useState<TodoCustomer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/todos");
      const payload = await response.json();
      setData(payload.data);
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: "客户",
      dataIndex: "name",
      render: (_: string, record: TodoCustomer) => (
        <Link href={`/customers/${record.id}`}>{record.name}</Link>
      )
    },
    { title: "电话", dataIndex: "phone" },
    {
      title: "阶段",
      dataIndex: "status",
      render: (value: string) => <Tag>{getStatusLabel(value as never)}</Tag>
    },
    {
      title: "下次联系",
      dataIndex: "nextContactAt",
      render: (value: string | null) => (value ? new Date(value).toLocaleString() : "-")
    },
    {
      title: "负责人",
      dataIndex: ["owner", "name"]
    }
  ];

  return (
    <div>
      <Typography.Title level={3}>我的待办</Typography.Title>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={data} />
      </Card>
    </div>
  );
}
