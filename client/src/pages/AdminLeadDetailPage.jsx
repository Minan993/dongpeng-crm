import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, setToken } from '../utils/api';

export const AdminLeadDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('新线索');
  const [content, setContent] = useState('');
  const load = async () => {
    setToken(localStorage.getItem('dp_token'));
    const res = await api.get(`/admin/leads/${id}`);
    setData(res.data);
    setStatus(res.data.status);
  };
  useEffect(() => { load(); }, [id]);
  if (!data) return null;
  return <main className='max-w-3xl mx-auto p-4 space-y-4'>
    <section className='card'><h2 className='text-xl'>{data.demand_no}</h2><p>{data.customer_name} / {data.phone}</p><p>{data.community}</p></section>
    <section className='card space-y-2'>
      <select className='input' value={status} onChange={(e) => setStatus(e.target.value)}>{['新线索','已联系','已到店','已量房','已报价','已成交','无效'].map((x)=><option key={x}>{x}</option>)}</select>
      <button className='btn-primary' onClick={async()=>{await api.patch(`/admin/leads/${id}`,{status});load();}}>保存状态</button>
    </section>
    <section className='card space-y-2'><h3>跟进记录</h3>
      {data.followups.map((f)=><div key={f.id} className='text-sm border-l pl-2'>{f.follower}: {f.content}</div>)}
      <input className='input' placeholder='跟进内容' value={content} onChange={(e)=>setContent(e.target.value)} />
      <button className='btn-secondary' onClick={async()=>{await api.post(`/admin/leads/${id}/followups`,{content,follower:'管理员'});setContent('');load();}}>添加记录</button>
    </section>
  </main>;
};
