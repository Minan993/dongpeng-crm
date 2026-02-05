import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu, Typography, Card } from 'antd'
import 'antd/dist/reset.css'

const { Header, Sider, Content } = Layout

function Dashboard() {
  return <Card title="数据看板">欢迎使用东鹏 CRM MVP（下一步将接入完整业务页面）</Card>
}

function Leads() {
  return <Card title="线索管理">支持新增/筛选/阶段推进（API 已预留）</Card>
}

function Customers() {
  return <Card title="客户管理">支持客户 360 与合并（API 已预留）</Card>
}

function App() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <Sider theme="light">
        <div style={{ padding: 16, fontWeight: 600 }}>东鹏 CRM</div>
        <Menu mode="inline" items={[
          { key: '1', label: <Link to="/">工作台</Link> },
          { key: '2', label: <Link to="/leads">线索</Link> },
          { key: '3', label: <Link to="/customers">客户</Link> },
        ]} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
          <Typography.Text>管理员：admin</Typography.Text>
        </Header>
        <Content style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
