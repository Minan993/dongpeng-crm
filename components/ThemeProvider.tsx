"use client";

import { ConfigProvider, theme } from "antd";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#0a84ff",
          colorInfo: "#0a84ff",
          borderRadius: 12,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif"
        },
        components: {
          Button: {
            controlHeight: 40
          },
          Card: {
            borderRadiusLG: 16
          },
          Layout: {
            headerBg: "#ffffff",
            bodyBg: "#f5f6f8",
            siderBg: "#ffffff"
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}
