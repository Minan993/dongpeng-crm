import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../utils/api';

export const AdminLeadsPage = () => {
  const [list, setList] = useState([]);
  const [q, setQ] = useState({ customerName: '', phone: '' });
  const navigate = useNavigate();
  const load = async () => {
    const token = localStorage.getItem('dp_token');
    if (!token) return navigate('/admin/login');
    setToken(token);
    const res = await api.get('/admin/leads', { params: q });
    setList(res.data.list);
  };
  useEffect(() => { load(); }, []);
  return <main className='p-4 max-w-5xl mx-auto space-y-4'>
    <h1 className='text-2xl font-light'>需求线索后台</h1>
    <section className='card flex flex-wrap gap-2'>
      <input className='input max-w-xs' placeholder='客户名' value={q.customerName} onChange={(e) => setQ({ ...q, customerName: e.target.value })} />
      <input className='input max-w-xs' placeholder='手机号' value={q.phone} onChange={(e) => setQ({ ...q, phone: e.target.value })} />
      <button className='btn-secondary' onClick={load}>筛选</button>
      <a className='btn-primary' href='/api/admin/export' target='_blank'>导出 Excel</a>
    </section>
    <section className='card overflow-auto'>
      <table className='min-w-full text-sm'><thead><tr className='text-left border-b'><th>编号</th><th>姓名</th><th>手机号</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>{list.map((row)=><tr className='border-b' key={row.id}><td>{row.demand_no}</td><td>{row.customer_name}</td><td>{row.phoneMasked}</td><td>{row.status}</td><td><Link className='text-blue-600' to={`/admin/leads/${row.id}`}>查看</Link></td></tr>)}</tbody></table>
    </section>
  </main>;
};
