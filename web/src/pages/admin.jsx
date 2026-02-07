import React, { useEffect, useState } from 'react';
import { request } from '../api';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [err, setErr] = useState('');
  const login = async () => {
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      localStorage.setItem('adminToken', data.token);
      location.href = '/admin';
    } catch (e) { setErr(e.message); }
  };
  return <div className="container card"><h2>管理员登录</h2><Input label="账号" value={username} onChange={e => setUsername(e.target.value)} /><Input label="密码" type="password" value={password} onChange={e => setPassword(e.target.value)} />{err && <p className="error">{err}</p>}<button onClick={login}>登录</button></div>;
}

const Input = ({ label, ...props }) => <label className="field"><span>{label}</span><input {...props} /></label>;

export function AdminPage() {
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({ keyword: '', status: '', store: '', staff: '', source: '', startDate: '', endDate: '' });
  const [note, setNote] = useState('');

  const load = async () => {
    const qs = new URLSearchParams(filters).toString();
    const data = await request(`/leads?${qs}`);
    setList(data.items);
  };
  useEffect(() => { load(); }, []);

  const openDetail = async (id) => setDetail(await request(`/leads/${id}`));
  const save = async () => {
    await request(`/leads/${detail.id}`, { method: 'PATCH', body: JSON.stringify({ status: detail.status, nextFollowUpAt: detail.next_follow_up_at }) });
    if (note) await request(`/leads/${detail.id}/notes`, { method: 'POST', body: JSON.stringify({ content: note }) });
    setNote('');
    await openDetail(detail.id);
    await load();
  };

  return <div className="admin-layout">
    <div className="card">
      <h2>线索管理</h2>
      <div className="row"><input placeholder="关键词(姓名/手机/小区)" value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} /><input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} /><input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} /><input placeholder="门店" value={filters.store} onChange={e => setFilters({ ...filters, store: e.target.value })} /><input placeholder="导购" value={filters.staff} onChange={e => setFilters({ ...filters, staff: e.target.value })} /><input placeholder="来源" value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })} /><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">全部状态</option>{['新线索', '已联系', '已量房', '已报价', '已下定', '已成交', '已流失'].map(v => <option key={v}>{v}</option>)}</select><button onClick={load}>筛选</button><a href="/api/export?format=csv" target="_blank">导出CSV</a></div>
      <table><thead><tr><th>创建时间</th><th>姓名</th><th>手机</th><th>门店</th><th>导购</th><th>来源</th><th>用砖时间</th><th>状态</th><th>下次跟进</th></tr></thead><tbody>{list.map(i => <tr key={i.id} onClick={() => openDetail(i.id)}><td>{new Date(i.created_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</td><td>{i.customer_name}</td><td>{i.phone}</td><td>{i.store}</td><td>{i.staff}</td><td>{i.source}</td><td>{i.expected_tile_time}</td><td>{i.status}</td><td>{i.next_follow_up_at ? new Date(i.next_follow_up_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}) : '-'}</td></tr>)}</tbody></table>
    </div>
    <div className="card">{detail ? <>
      <h3>详情：{detail.lead_no}</h3>
      <pre>{JSON.stringify(detail.data, null, 2)}</pre>
      <label className="field"><span>状态</span><select value={detail.status} onChange={e => setDetail({ ...detail, status: e.target.value })}>{['新线索', '已联系', '已量房', '已报价', '已下定', '已成交', '已流失'].map(v => <option key={v}>{v}</option>)}</select></label>
      <label className="field"><span>下次跟进</span><input type="datetime-local" value={(detail.next_follow_up_at || '').slice(0,16)} onChange={e => setDetail({ ...detail, next_follow_up_at: e.target.value })} /></label>
      <textarea rows="3" placeholder="追加跟进记录" value={note} onChange={e => setNote(e.target.value)} />
      <button onClick={save}>保存</button>
      <h4>跟进时间线</h4>
      <ul>{detail.notes.map(n => <li key={n.id}>{new Date(n.created_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})} - {n.content}</li>)}</ul>
    </> : <p>点击左侧记录查看详情</p>}</div>
  </div>;
}
