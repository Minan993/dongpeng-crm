"use client";

import { AntdRegistry as AntdNextRegistry } from "@ant-design/nextjs-registry";

export default function AntdRegistry({ children }: { children: React.ReactNode }) {
  return <AntdNextRegistry>{children}</AntdNextRegistry>;
}
