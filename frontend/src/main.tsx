import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import axios from 'axios'
import 'antd/dist/reset.css'

const { Header, Sider, Content } = Layout

const api = axios.create({ baseURL: '/api/v1' })

type ApiResp<T> = { code: number; message: string; data: T }
type Lead = { id: string; name: string; mobile: string; source: string; stage: string }
type Customer = { id: string; name: string; mobile: string }
type Order = { id: string; order_no: string; status: string; total_amount: number; paid_amount: number }
type Ticket = { id: string; ticket_no: string; type: string; status: string }

type MeData = {
  id: string
  username: string
  real_name?: string
  roles: string[]
  permissions: string[]
  menus: string[]
}

function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('crm_token', token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem('crm_token')
    delete api.defaults.headers.common.Authorization
  }
}

function initAuthToken() {
  const token = localStorage.getItem('crm_token')
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  }
}

function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [loading, setLoading] = useState(false)

  const onFinish = async (vals: { username: string; password: string }) => {
    try {
      setLoading(true)
      const { data } = await api.post<ApiResp<{ access_token: string }>>('/auth/login', vals)
      setAuthToken(data.data.access_token)
      message.success('登录成功')
      onLoginSuccess()
    } catch (e: any) {
      message.error(e?.response?.data?.message || e?.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f7', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="东鹏 CRM 登录" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: 'Admin@12345' }}>
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
        </Form>
      </Card>
    </Layout>
  )
}

function Dashboard() {
  return <Card title="数据看板">已可登录并接入核心业务 CRUD（线索/客户/订单/售后）</Card>
}

function LeadsPage() {
  const [rows, setRows] = useState<Lead[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    const { data } = await api.get<ApiResp<Lead[]>>('/leads')
    setRows(data.data)
  }

  useEffect(() => { void load() }, [])

  const onCreate = async () => {
    const vals = await form.validateFields()
    setLoading(true)
    try {
      await api.post('/leads', vals)
      message.success('线索已创建')
      setOpen(false)
      form.resetFields()
      await load()
    } finally {
      setLoading(false)
    }
  }

  const onStage = async (id: string, stage: string) => {
    await api.put(`/leads/${id}/stage`, { stage })
    message.success('阶段已更新')
    await load()
  }

  return (
    <Card
      title="线索管理"
      extra={<Button type="primary" onClick={() => setOpen(true)}>新增线索</Button>}
    >
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 8 }}
        columns={[
          { title: '姓名', dataIndex: 'name' },
          { title: '手机号', dataIndex: 'mobile' },
          { title: '来源', dataIndex: 'source' },
          { title: '阶段', dataIndex: 'stage', render: (v: string) => <Tag color="blue">{v}</Tag> },
          {
            title: '操作', render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => onStage(r.id, 'measuring')}>推进到量尺</Button>
                <Button size="small" onClick={() => onStage(r.id, 'quoted')}>推进到报价</Button>
              </Space>
            )
          },
        ]}
      />
      <Modal title="新增线索" open={open} onOk={onCreate} onCancel={() => setOpen(false)} confirmLoading={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="mobile" label="手机号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="source" label="来源" rules={[{ required: true }]}><Input placeholder="抖音/转介绍/自然到店" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    const { data } = await api.get<ApiResp<Customer[]>>('/customers')
    setRows(data.data)
  }

  useEffect(() => { void load() }, [])

  const onCreate = async () => {
    const vals = await form.validateFields()
    setLoading(true)
    try {
      await api.post('/customers', vals)
      message.success('客户已创建')
      setOpen(false)
      form.resetFields()
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message || e?.response?.data?.detail || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="客户管理" extra={<Button type="primary" onClick={() => setOpen(true)}>新增客户</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 8 }}
        columns={[
          { title: '客户姓名', dataIndex: 'name' },
          { title: '手机号', dataIndex: 'mobile' },
        ]}
      />
      <Modal title="新增客户" open={open} onOk={onCreate} onCancel={() => setOpen(false)} confirmLoading={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="mobile" label="手机号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="wechat" label="微信号"><Input /></Form.Item>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    const { data } = await api.get<ApiResp<Order[]>>('/orders')
    setRows(data.data)
  }

  useEffect(() => { void load() }, [])

  const onCreate = async () => {
    const vals = await form.validateFields()
    setLoading(true)
    try {
      await api.post('/orders', vals)
      message.success('订单已创建')
      setOpen(false)
      form.resetFields()
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message || e?.response?.data?.detail || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="订单管理" extra={<Button type="primary" onClick={() => setOpen(true)}>新增订单</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 8 }}
        columns={[
          { title: '订单号', dataIndex: 'order_no' },
          { title: '状态', dataIndex: 'status' },
          { title: '总额', dataIndex: 'total_amount' },
          { title: '已付', dataIndex: 'paid_amount' },
        ]}
      />
      <Modal title="新增订单" open={open} onOk={onCreate} onCancel={() => setOpen(false)} confirmLoading={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="order_no" label="订单号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="customer_id" label="客户ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="total_amount" label="订单总额" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

function TicketsPage() {
  const [rows, setRows] = useState<Ticket[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    const { data } = await api.get<ApiResp<Ticket[]>>('/tickets')
    setRows(data.data)
  }

  useEffect(() => { void load() }, [])

  const onCreate = async () => {
    const vals = await form.validateFields()
    setLoading(true)
    try {
      await api.post('/tickets', vals)
      message.success('售后工单已创建')
      setOpen(false)
      form.resetFields()
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message || e?.response?.data?.detail || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="售后工单" extra={<Button type="primary" onClick={() => setOpen(true)}>新增工单</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 8 }}
        columns={[
          { title: '工单号', dataIndex: 'ticket_no' },
          { title: '类型', dataIndex: 'type' },
          { title: '状态', dataIndex: 'status' },
        ]}
      />
      <Modal title="新增售后工单" open={open} onOk={onCreate} onCancel={() => setOpen(false)} confirmLoading={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="ticket_no" label="工单号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="customer_id" label="客户ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="问题类型" rules={[{ required: true }]}><Input placeholder="破损/补货/色差" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

function Shell({ me, onLogout }: { me: MeData; onLogout: () => void }) {
  const nav = useNavigate()
  const menuItems = useMemo(() => [
    { key: '/dashboard', label: <Link to="/dashboard">工作台</Link> },
    { key: '/leads', label: <Link to="/leads">线索</Link> },
    { key: '/customers', label: <Link to="/customers">客户</Link> },
    { key: '/orders', label: <Link to="/orders">订单</Link> },
    { key: '/tickets', label: <Link to="/tickets">售后</Link> },
  ], [])

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <Sider theme="light">
        <div style={{ padding: 16, fontWeight: 600 }}>东鹏 CRM</div>
        <Menu
          mode="inline"
          items={menuItems}
          onClick={({ key }) => nav(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text>管理员：{me.real_name || me.username}</Typography.Text>
          <Button onClick={onLogout}>退出登录</Button>
        </Header>
        <Content style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function Root() {
  const [me, setMe] = useState<MeData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMe = async () => {
    try {
      const { data } = await api.get<ApiResp<MeData>>('/auth/me')
      setMe(data.data)
    } catch {
      setMe(null)
      setAuthToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initAuthToken()
    void loadMe()
  }, [])

  if (loading) {
    return <Layout style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}><Typography.Text>加载中...</Typography.Text></Layout>
  }

  if (!me) {
    return <LoginPage onLoginSuccess={() => void loadMe()} />
  }

  return <Shell me={me} onLogout={() => { setAuthToken(null); setMe(null) }} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AntdApp>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </AntdApp>
  </React.StrictMode>
)
