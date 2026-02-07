import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../api';

const sources = ['门店进店', '抖音视频号', '老客户转介绍', '装企', '设计师', '工长', '活动', '其他'];
const stores = ['居然之家店', '建材港店', '其他'];
const defaultStaffList = ['王磊', '李娜', '陈晨', '赵宇'];
const multiSpaces = ['客厅', '餐厅', '厨房', '卫生间', '卧室', '阳台', '背景墙', '全屋'];
const styles = ['现代', '轻奢', '奶油', '原木', '法式', '新中式', '意式极简', '其他'];
const sizes = ['750×1500', '600×1200', '800×800', '400×800', '900×1800', '1200×2400'];
const crafts = ['亮光', '柔光', '哑光', '微水泥', '仿石', '木纹', '超平釉', '其他'];
const steps = ['基本信息', '房屋信息', '装修需求', '关键时间'];

const initial = { spaces: [], stylePreferences: [], sizePreferences: [], craftPreferences: [] };

const Input = ({ label, ...props }) => <label className="field"><span>{label}</span><input {...props} /></label>;
const Select = ({ label, children, ...props }) => <label className="field"><span>{label}</span><select {...props}>{children}</select></label>;

export function FormPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => ({ ...initial, ...(JSON.parse(localStorage.getItem('leadDraft') || '{}')) }));
  const [done, setDone] = useState(null);
  const [staffList, setStaffList] = useState(defaultStaffList);

  useEffect(() => localStorage.setItem('leadDraft', JSON.stringify(form)), [form]);
  useEffect(() => {
    fetch('/staff.json').then(r => r.json()).then(data => Array.isArray(data) && setStaffList(data)).catch(() => {});
  }, []);

  const progress = useMemo(() => `${((step + 1) / 4) * 100}%`, [step]);

  const onSubmit = async () => {
    const data = await request('/leads', { method: 'POST', body: JSON.stringify(form) });
    localStorage.removeItem('leadDraft');
    setDone(data);
  };

  if (done) {
    const url = `${location.origin}/admin`;
    return <div className="container card center"><h1>提交成功</h1><p>记录编号：{done.leadId}</p><div className="row"><button onClick={() => navigator.clipboard.writeText(done.leadId)}>复制编号</button><button onClick={() => navigator.clipboard.writeText(url)}>复制链接</button></div></div>;
  }

  return <div className="container">
    <h1>东鹏瓷砖客户需求表</h1>
    <div className="progress"><div style={{ width: progress }} /></div>
    <p className="muted">Step {step + 1}/4 · {steps[step]}</p>
    <div className="card">
      {step === 0 && <>
        <Input label="客户姓名*" value={form.customerName || ''} onChange={e => setForm({ ...form, customerName: e.target.value })} />
        <Input label="手机号*" value={form.phone || ''} maxLength={11} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
        <Input label="微信号" value={form.wechat || ''} onChange={e => setForm({ ...form, wechat: e.target.value })} />
        <Select label="客户来源*" value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })}><option value="">请选择</option>{sources.map(v => <option key={v}>{v}</option>)}</Select>
        <Select label="接待门店*" value={form.store || ''} onChange={e => setForm({ ...form, store: e.target.value })}><option value="">请选择</option>{stores.map(v => <option key={v}>{v}</option>)}</Select>
        <Input label="导购/业务员*" list="staffs" value={form.staff || ''} onChange={e => setForm({ ...form, staff: e.target.value })} /><datalist id="staffs">{staffList.map(v => <option key={v} value={v} />)}</datalist>
        <Input label="备注" value={form.remark || ''} onChange={e => setForm({ ...form, remark: e.target.value })} />
      </>}
      {step === 1 && <>
        <Input label="小区名称*" value={form.community || ''} onChange={e => setForm({ ...form, community: e.target.value })} />
        <Input label="详细地址" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
        <Select label="房屋类型*" value={form.houseType || ''} onChange={e => setForm({ ...form, houseType: e.target.value })}><option value="" />{['新房', '二手翻新', '工装'].map(v => <option key={v}>{v}</option>)}</Select>
        <Select label="户型*" value={form.layout || ''} onChange={e => setForm({ ...form, layout: e.target.value })}><option value="" />{['2室', '3室', '4室', '别墅', '其他'].map(v => <option key={v}>{v}</option>)}</Select>
        <Input label="建筑面积㎡*" type="number" value={form.buildingArea || ''} onChange={e => setForm({ ...form, buildingArea: e.target.value })} />
        <Input label="使用面积㎡" type="number" value={form.usingArea || ''} onChange={e => setForm({ ...form, usingArea: e.target.value })} />
        <Select label="当前阶段*" value={form.currentStage || ''} onChange={e => setForm({ ...form, currentStage: e.target.value })}><option value="" />{['未交付', '已交付未开工', '已开工'].map(v => <option key={v}>{v}</option>)}</Select>
      </>}
      {step === 2 && <>
        <Select label="装修方式*" value={form.decorationMode || ''} onChange={e => setForm({ ...form, decorationMode: e.target.value })}><option value="" />{['自装', '半包', '全包', '整装公司'].map(v => <option key={v}>{v}</option>)}</Select>
        <Input label="装企名称" value={form.companyName || ''} onChange={e => setForm({ ...form, companyName: e.target.value })} />
        <Input label="设计师/工长信息" value={form.designerInfo || ''} onChange={e => setForm({ ...form, designerInfo: e.target.value })} />
        {[['spaces', multiSpaces, '空间需求'], ['stylePreferences', styles, '风格偏好'], ['sizePreferences', sizes, '规格偏好'], ['craftPreferences', crafts, '工艺偏好']].map(([key, list, title]) =>
          <div className="field" key={key}><span>{title}</span><div className="chips">{list.map(v => <button type="button" className={form[key].includes(v) ? 'chip active' : 'chip'} key={v} onClick={() => setForm({ ...form, [key]: form[key].includes(v) ? form[key].filter(x => x !== v) : [...form[key], v] })}>{v}</button>)}</div></div>)}
        <Select label="预算区间*" value={form.budgetRange || ''} onChange={e => setForm({ ...form, budgetRange: e.target.value })}><option value="" />{['1-3万', '3-5万', '5-8万', '8-12万', '12万+'].map(v => <option key={v}>{v}</option>)}</Select>
        <Input label="颜色偏好" value={form.colorPreference || ''} onChange={e => setForm({ ...form, colorPreference: e.target.value })} />
      </>}
      {step === 3 && <>
        <Input label="预计量房时间" type="datetime-local" value={form.measureTime || ''} onChange={e => setForm({ ...form, measureTime: e.target.value })} />
        <Input label="预计下定时间" type="date" value={form.orderTime || ''} onChange={e => setForm({ ...form, orderTime: e.target.value })} />
        <Input label="预计用砖时间*" value={form.expectedTileTime || ''} onChange={e => setForm({ ...form, expectedTileTime: e.target.value })} placeholder="如 2026-03 或 2026-03-10" />
        <Select label="交付/铺贴要求" value={form.deliveryReq || ''} onChange={e => setForm({ ...form, deliveryReq: e.target.value })}><option value="" />{['急', '正常', '不确定'].map(v => <option key={v}>{v}</option>)}</Select>
      </>}
    </div>
    <div className="sticky-actions row">
      <button disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button>
      {step < 3 ? <button onClick={() => setStep(step + 1)}>下一步</button> : <button onClick={onSubmit}>提交</button>}
    </div>
  </div>;
}
