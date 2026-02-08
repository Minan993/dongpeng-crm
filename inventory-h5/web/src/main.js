import './style.css';

const app = document.querySelector('#app');
const API = '/api';

function token() { return localStorage.getItem('token') || ''; }
function esc(s=''){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || '请求失败');
  const type = res.headers.get('content-type') || '';
  return type.includes('application/json') ? res.json() : res.blob();
}

function route(path){history.pushState({},'',path);render();}
window.addEventListener('popstate', render);

async function renderHome() {
  app.innerHTML = `<div class="container"><h1 class="title">库存查询</h1><input id="q" class="search" placeholder="搜索名称或型号" autofocus/><div id="list" style="margin-top:16px"></div></div>`;
  const q = document.querySelector('#q');
  const list = document.querySelector('#list');
  async function load(){
    const data = await request(`${API}/items?keyword=${encodeURIComponent(q.value)}&page=1&pageSize=50`);
    list.innerHTML = data.items.map(item=>`<div class="card"><div class="item-top"><div><div class="model">${esc(item.model)}</div><div class="name">${esc(item.name)}</div><div class="meta">${esc(item.brand||'-')} · ${esc(item.spec||'-')} · 批次 ${esc(item.batch||'-')}</div></div><div class="qty">${item.qty}</div></div><details><summary>备注</summary><p>${esc(item.remark||'无')}</p></details><a class="link" href="/item/${item.id}" data-link>查看详情</a></div>`).join('') || '<div class="muted">暂无数据</div>';
    list.querySelectorAll('[data-link]').forEach(a=>a.onclick=(e)=>{e.preventDefault();route(a.getAttribute('href'));});
  }
  q.addEventListener('input', load);
  load();
}

async function renderDetail(id) {
  const item = await request(`${API}/items/${id}`);
  app.innerHTML = `<div class="container"><a class="link" href="/" data-link>← 返回</a><div class="card"><h2>${esc(item.model)} / ${esc(item.name)}</h2><p>品牌：${esc(item.brand||'-')}</p><p>规格：${esc(item.spec||'-')}</p><p>批次：${esc(item.batch||'-')}</p><p>库存：<b>${item.qty}</b></p><p>备注：${esc(item.remark||'无')}</p></div></div>`;
  document.querySelector('[data-link]').onclick=(e)=>{e.preventDefault();route('/');};
}

async function renderAdmin() {
  app.innerHTML = `<div class="container"><h1 class="title">管理员后台</h1><div id="body"></div></div>`;
  const body = document.querySelector('#body');

  const drawLogin = ()=>{
    body.innerHTML = `<div class="card"><div class="form-grid"><input id="u" class="input" value="admin"/><input id="p" class="input" type="password" value="123"/></div><div class="toolbar"><button class="btn" id="login">登录</button><a class="link" href="/" data-link>返回前台</a></div></div>`;
    document.querySelector('[data-link]').onclick=(e)=>{e.preventDefault();route('/');};
    document.querySelector('#login').onclick = async ()=>{
      try {
        const data = await request(`${API}/auth/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value,password:p.value})});
        localStorage.setItem('token',data.token);loadAdmin();
      } catch (e) { alert(e.message); }
    };
  };

  const loadAdmin = async ()=>{
    const data = await request(`${API}/items?page=1&pageSize=200`);
    body.innerHTML = `<div class="toolbar"><input id="aq" class="search" style="max-width:280px" placeholder="搜索"/><button class="btn" id="new">新增</button><button class="btn light" id="export">导出CSV</button><input type="file" id="file" accept=".csv"/><button class="btn light" id="import">导入CSV</button><button class="btn danger" id="logout">退出</button></div><div class="card"><table class="table"><thead><tr><th>ID</th><th>型号</th><th>名称</th><th>库存</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${data.items.map(i=>`<tr><td>${i.id}</td><td>${esc(i.model)}</td><td>${esc(i.name)}</td><td>${i.qty}</td><td>${new Date(i.updated_at).toLocaleString()}</td><td><button class='btn light' data-edit='${i.id}'>编辑</button> <button class='btn danger' data-del='${i.id}'>删除</button></td></tr>`).join('')}</tbody></table></div><dialog id="dlg"></dialog>`;
    document.querySelector('#logout').onclick=()=>{localStorage.removeItem('token');drawLogin();};
    document.querySelector('#export').onclick=()=>window.open(`${API}/admin/items/export?keyword=${encodeURIComponent(document.querySelector('#aq').value||'')}`,'_blank');
    document.querySelector('#import').onclick=async()=>{
      const f=document.querySelector('#file').files[0]; if(!f) return alert('请选择 CSV');
      const fd=new FormData(); fd.append('file',f);
      await request(`${API}/admin/items/import`,{method:'POST',body:fd}); alert('导入成功'); loadAdmin();
    };
    document.querySelector('#aq').oninput=async(e)=>{
      const d=await request(`${API}/items?keyword=${encodeURIComponent(e.target.value)}&page=1&pageSize=200`);
      document.querySelector('tbody').innerHTML=d.items.map(i=>`<tr><td>${i.id}</td><td>${esc(i.model)}</td><td>${esc(i.name)}</td><td>${i.qty}</td><td>${new Date(i.updated_at).toLocaleString()}</td><td><button class='btn light' data-edit='${i.id}'>编辑</button> <button class='btn danger' data-del='${i.id}'>删除</button></td></tr>`).join('');
      bindRowActions(d.items);
    };
    function openForm(item){
      const dlg=document.querySelector('#dlg');
      dlg.innerHTML=`<form method='dialog'><h3>${item?'编辑':'新增'}库存</h3><div class='form-grid'><input class='input' name='model' placeholder='型号' value='${esc(item?.model||'')}' required/><input class='input' name='name' placeholder='名称' value='${esc(item?.name||'')}' required/><input class='input' name='brand' placeholder='品牌' value='${esc(item?.brand||'')}'/><input class='input' name='spec' placeholder='规格' value='${esc(item?.spec||'')}'/><input class='input' name='batch' placeholder='批次' value='${esc(item?.batch||'')}'/><input class='input' name='qty' type='number' min='0' value='${item?.qty||0}' required/><textarea class='input full' name='remark' placeholder='备注'>${esc(item?.remark||'')}</textarea></div><div class='toolbar'><button class='btn' value='save'>保存</button><button class='btn light' value='cancel'>取消</button></div></form>`;
      dlg.showModal();
      dlg.querySelector('form').onsubmit=async(ev)=>{ev.preventDefault();const fd=new FormData(ev.target);const payload=Object.fromEntries(fd.entries());payload.qty=Number(payload.qty);
        if(item) await request(`${API}/admin/items/${item.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        else await request(`${API}/admin/items`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        dlg.close();loadAdmin();
      };
    }
    function bindRowActions(items){
      document.querySelectorAll('[data-edit]').forEach(btn=>btn.onclick=()=>openForm(items.find(i=>String(i.id)===btn.dataset.edit)));
      document.querySelectorAll('[data-del]').forEach(btn=>btn.onclick=async()=>{if(confirm('确认删除该记录？')){await request(`${API}/admin/items/${btn.dataset.del}`,{method:'DELETE'});loadAdmin();}});
    }
    document.querySelector('#new').onclick=()=>openForm(null);
    bindRowActions(data.items);
  };

  if (!token()) drawLogin(); else loadAdmin();
}

async function render() {
  try {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return renderAdmin();
    if (path.startsWith('/item/')) return renderDetail(path.split('/').pop());
    return renderHome();
  } catch (e) {
    app.innerHTML = `<div class="container"><div class="card">${esc(e.message)}</div></div>`;
  }
}

render();
