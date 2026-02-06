import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const initial = {
  basic: { customerName: '', phone: '', wechat: '', region: '', source: '', store: '', sales: '', remark: '' },
  house: { community: '', address: '', houseType: '', layout: '', buildingArea: '', innerArea: '', elevator: false, floor: '', measured: false, hasDesign: false },
  needs: { renovationType: '', companyName: '', designerContact: '', styles: [], spaces: [], floorHeating: false, antiSlip: false, specialNeeds: '' },
  tilePlan: { startDate: '', expectedTileDate: '', urgent: false, sizePrefs: [], colorPref: '', quantities: [{ space: '', size: '', area: '', note: '' }], materials: [], needMeasureService: false, needDelivery: false },
  budget: { budgetRange: '', expectedUnitPrice: '', concerns: [], comparedBrands: [], visitDate: '', contactTime: '', other: '' },
  confirmed: false
};

const regions = ['浉河','平桥','羊山','罗山','潢川','固始','息县','淮滨','光山','新县','商城','其他'];

const multiToggle = (arr, item) => arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

export const FormPage = () => {
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [salesList, setSalesList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const draft = localStorage.getItem('dp_draft');
    if (draft) setForm(JSON.parse(draft));
    api.get('/meta/sales').then((r) => setSalesList(r.data));
  }, []);

  const steps = useMemo(() => ['基本信息', '房屋信息', '装修需求', '用砖与时间', '预算决策', '确认提交'], []);
  const saveDraft = () => localStorage.setItem('dp_draft', JSON.stringify(form));

  const submit = async () => {
    const payload = {
      ...form,
      house: { ...form.house, buildingArea: Number(form.house.buildingArea), innerArea: Number(form.house.innerArea || 0) || undefined, floor: Number(form.house.floor || 0) || undefined },
      tilePlan: { ...form.tilePlan, quantities: form.tilePlan.quantities.map((q) => ({ ...q, area: Number(q.area || 0) || undefined })) },
      budget: { ...form.budget, expectedUnitPrice: Number(form.budget.expectedUnitPrice || 0) || undefined }
    };
    const res = await api.post('/public/lead', payload);
    localStorage.removeItem('dp_draft');
    navigate('/success', { state: res.data });
  };

  return <main className='max-w-md mx-auto p-4 pb-24 space-y-4'>
    <div className='text-sm text-slate-500'>{steps[step]}（{step + 1}/{steps.length}）</div>
    <div className='h-1 bg-slate-200 rounded'><div className='h-1 bg-slate-800 rounded' style={{ width: `${(step + 1) / steps.length * 100}%` }} /></div>
    <section className='card space-y-3'>
      {step === 0 && <>
        <input className='input' placeholder='客户姓名*' value={form.basic.customerName} onChange={(e) => setForm({ ...form, basic: { ...form.basic, customerName: e.target.value } })} />
        <input className='input' placeholder='手机号*' value={form.basic.phone} onChange={(e) => setForm({ ...form, basic: { ...form.basic, phone: e.target.value } })} />
        <select className='input' value={form.basic.region} onChange={(e) => setForm({ ...form, basic: { ...form.basic, region: e.target.value } })}><option value=''>所在区域*</option>{regions.map((r)=><option key={r}>{r}</option>)}</select>
        <input className='input' placeholder='客户来源*' value={form.basic.source} onChange={(e) => setForm({ ...form, basic: { ...form.basic, source: e.target.value } })} />
        <select className='input' value={form.basic.sales} onChange={(e) => setForm({ ...form, basic: { ...form.basic, sales: e.target.value } })}><option value=''>接待导购</option>{salesList.map((s)=><option key={s}>{s}</option>)}</select>
      </>}
      {step === 1 && <>
        <input className='input' placeholder='小区/项目名称*' value={form.house.community} onChange={(e) => setForm({ ...form, house: { ...form.house, community: e.target.value } })} />
        <input className='input' placeholder='房屋类型*' value={form.house.houseType} onChange={(e) => setForm({ ...form, house: { ...form.house, houseType: e.target.value } })} />
        <input className='input' placeholder='建筑面积㎡*' value={form.house.buildingArea} onChange={(e) => setForm({ ...form, house: { ...form.house, buildingArea: e.target.value } })} />
      </>}
      {step === 2 && <>
        <input className='input' placeholder='装修方式*' value={form.needs.renovationType} onChange={(e) => setForm({ ...form, needs: { ...form.needs, renovationType: e.target.value } })} />
        <div className='text-xs'>风格偏好</div>
        <div className='flex flex-wrap gap-2'>{['现代','奶油','极简'].map((x)=><button type='button' key={x} className='btn-secondary' onClick={()=>setForm({...form,needs:{...form.needs,styles:multiToggle(form.needs.styles,x)}})}>{x}</button>)}</div>
      </>}
      {step === 3 && <>
        <input type='date' className='input' value={form.tilePlan.expectedTileDate} onChange={(e) => setForm({ ...form, tilePlan: { ...form.tilePlan, expectedTileDate: e.target.value } })} />
        <input className='input' placeholder='颜色倾向' value={form.tilePlan.colorPref} onChange={(e) => setForm({ ...form, tilePlan: { ...form.tilePlan, colorPref: e.target.value } })} />
      </>}
      {step === 4 && <>
        <input className='input' placeholder='瓷砖预算区间*' value={form.budget.budgetRange} onChange={(e) => setForm({ ...form, budget: { ...form.budget, budgetRange: e.target.value } })} />
        <input type='date' className='input' value={form.budget.visitDate} onChange={(e) => setForm({ ...form, budget: { ...form.budget, visitDate: e.target.value } })} />
      </>}
      {step === 5 && <label className='flex gap-2 items-center'><input type='checkbox' checked={form.confirmed} onChange={(e) => setForm({ ...form, confirmed: e.target.checked })} /> 我确认信息真实</label>}
    </section>
    <footer className='fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-2 justify-center'>
      <button className='btn-secondary' onClick={() => setStep(Math.max(step - 1, 0))}>上一步</button>
      <button className='btn-secondary' onClick={saveDraft}>保存草稿</button>
      {step < 5 ? <button className='btn-primary' onClick={() => setStep(step + 1)}>下一步</button> : <button className='btn-primary' disabled={!form.confirmed} onClick={submit}>提交</button>}
    </footer>
  </main>;
};
