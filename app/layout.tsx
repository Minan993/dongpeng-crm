import type { Metadata } from "next";
import AntdRegistry from "@/components/AntdRegistry";
import "./globals.css";

export const metadata: Metadata = {
  title: "东鹏 CRM",
  description: "信阳东鹏瓷砖客户管理系统"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
