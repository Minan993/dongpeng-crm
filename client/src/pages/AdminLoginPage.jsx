import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../utils/api';

export const AdminLoginPage = () => {
  const [username, setU] = useState('admin');
  const [password, setP] = useState('Admin@123');
  const navigate = useNavigate();
  const login = async () => {
    const res = await api.post('/admin/login', { username, password });
    localStorage.setItem('dp_token', res.data.token);
    setToken(res.data.token);
    navigate('/admin');
  };
  return <main className='max-w-sm mx-auto p-6 pt-20'><section className='card space-y-3'>
    <h1 className='text-xl font-light'>后台登录</h1>
    <input className='input' value={username} onChange={(e) => setU(e.target.value)} />
    <input className='input' value={password} type='password' onChange={(e) => setP(e.target.value)} />
    <button className='btn-primary w-full' onClick={login}>登录</button>
  </section></main>;
};
