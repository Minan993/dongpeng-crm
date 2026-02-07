import { Link, useLocation } from 'react-router-dom';

export const SuccessPage = () => {
  const { state } = useLocation();
  return (
    <main className='max-w-md mx-auto p-5 pt-20'>
      <section className='card text-center space-y-3'>
        <h2 className='text-2xl font-light'>提交成功</h2>
        <p className='text-sm'>需求编号：<span className='font-medium'>{state?.demandNo || '-'}</span></p>
        <p className='text-xs text-slate-500'>提交时间：{state?.submittedAt || '-'}</p>
        <button className='btn-secondary' onClick={() => navigator.clipboard.writeText(state?.demandNo || '')}>复制编号</button>
        <Link to='/' className='btn-primary inline-block'>返回首页</Link>
      </section>
    </main>
  );
};
