import { Link } from 'react-router-dom';

export const HomePage = () => (
  <main className='max-w-md mx-auto px-5 py-10 space-y-6'>
    <section className='card text-center space-y-3'>
      <p className='text-xs tracking-widest text-slate-500'>信阳服务 20 年</p>
      <h1 className='text-3xl font-light'>东鹏瓷砖客户需求单</h1>
      <p className='text-sm text-slate-500'>请用 3-5 分钟完善信息，门店导购将快速匹配方案。</p>
      <Link to='/form' className='btn-primary inline-block'>开始填写</Link>
    </section>
    <p className='text-xs text-slate-400 text-center'>隐私说明：仅用于需求对接，不会用于营销滥用。</p>
  </main>
);
