/** One view over the five existing record stores; all user text is rendered as text. */
function downloadRecordSelection(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});if(blob.size>BACKUP_MAX_BYTES)throw new RangeError('备份超过2MB，请减少选中数量');
  const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='命理选中记录_'+fmtLocalDate(new Date())+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function refreshRecordViews(){
  renderRecords();['zw','bz','qm','ly'].forEach(renderModRecords);document.querySelector('[aria-label="搜索本地排盘记录"]')?.dispatchEvent(new Event('input'));
}
function showRecordManager(){
  if(document.querySelector('.records-manager-overlay'))return;
  const previous=document.activeElement,overlay=document.createElement('div'),card=document.createElement('div');overlay.className='workspace-dialog records-manager-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','record-manager-title');card.className='workspace-dialog-card records-manager-card';overlay.appendChild(card);
  card.innerHTML='<h2 id="record-manager-title">统一记录管理</h2><p>管理已有五类记录。备注随备份保存；API设置和AI草稿单独管理。选中备份使用v6-selection格式，仅新版支持合并导入，旧版会拒绝；完整v4/v5备份仍按原规则恢复。</p><div class="record-manager-filters"><input id="record-manager-search" type="search" maxlength="200" aria-label="搜索全部排盘记录" placeholder="姓名、日期、地点、备注"><select id="record-manager-category" aria-label="筛选记录模块"><option value="all">全部五类</option></select><select id="record-manager-sort" aria-label="记录排序"><option value="updated-desc">最近更新</option><option value="updated-asc">最早更新</option><option value="date-desc">出生日期从晚到早</option><option value="date-asc">出生日期从早到晚</option><option value="name">姓名</option></select></div><div class="record-manager-actions"><label><input id="record-manager-select-visible" type="checkbox">选择当前结果</label><button type="button" id="record-manager-export" class="btn btn-ghost">导出选中</button><button type="button" id="record-manager-delete" class="btn btn-ghost">删除选中</button><button type="button" id="record-manager-clear" class="btn btn-ghost">清空五类记录</button></div><p id="record-manager-status" role="status" aria-live="polite"></p><div id="record-manager-list"></div><button type="button" id="record-manager-close" class="btn btn-primary">关闭记录管理</button>';
  const find=id=>card.querySelector('#record-manager-'+id),selected=new Map();let visible=[];
  const close=()=>{overlay.remove();previous?.focus();};
  const status=text=>{find('status').textContent=text;};
  const selection=()=>[...selected.values()];
  const updateSelection=()=>{const n=selected.size;find('export').disabled=!n;find('delete').disabled=!n;find('select-visible').checked=!!visible.length&&visible.every(({key,record})=>selected.has(key+'/'+record.id));find('select-visible').indeterminate=visible.some(({key,record})=>selected.has(key+'/'+record.id))&&!find('select-visible').checked;find('select-visible').disabled=!visible.length;status('当前 '+visible.length+' 条；已选 '+n+' 条（选中项可包含当前筛选外的记录）');};
  const render=()=>{
    const list=find('list');list.replaceChildren();
    try{
      visible=listRecordEntries({query:find('search').value,category:find('category').value,sort:find('sort').value});
      for(const {key,record:r} of visible){
        const row=document.createElement('article');row.className='record-manager-row';row.dataset.recordKey=key;row.dataset.recordId=r.id;
        const top=document.createElement('div'),label=document.createElement('label'),check=document.createElement('input');top.className='record-manager-row-heading';check.type='checkbox';check.checked=selected.has(key+'/'+r.id);check.setAttribute('aria-label','选择'+RECORD_LABELS[key]+'记录'+(r.name||r.dateStr));label.append(check,document.createTextNode(RECORD_LABELS[key]+' · '+(r.name||'未命名')+' · '+r.dateStr));check.onchange=()=>{if(check.checked)selected.set(key+'/'+r.id,{key,id:r.id});else selected.delete(key+'/'+r.id);updateSelection();};top.appendChild(label);
        const load=document.createElement('button');load.type='button';load.className='btn btn-ghost';load.textContent='重新排盘';load.onclick=()=>{const tab={ml_records:'zonghe',bz_records:'bazi',zw_records:'ziwei',qm_records:'qimen',ly_records:'liuyao'}[key];document.querySelector('.tab[data-tab="'+tab+'"]').click();close();if(key===REC_KEY)recordReload(r.id);else modRecordReload(Object.keys(MOD_REC_KEYS).find(k=>MOD_REC_KEYS[k]===key),r.id);};top.appendChild(load);
        const detail=document.createElement('p');detail.textContent=[r.time||HOUR_NAMES[r.hourIdx],r.place,r.bazi||r.title||r.pillars].filter(Boolean).join(' · ');
        const note=document.createElement('textarea');note.maxLength=1000;note.rows=2;note.value=r.note||'';note.setAttribute('aria-label','备注 '+RECORD_LABELS[key]+' '+(r.name||r.dateStr));note.placeholder='备注（最多1000字，可能包含个人信息）';
        const save=document.createElement('button');save.type='button';save.className='btn btn-ghost';save.textContent='保存备注';save.onclick=()=>{try{updateRecordNote(key,r.id,note.value);refreshRecordViews();render();status('备注已保存。');}catch(e){status(e.message);}};
        row.append(top,detail,note,save);list.appendChild(row);
      }
      if(!visible.length)list.textContent='没有符合条件的记录。';updateSelection();
    }catch(e){status('记录读取失败：'+e.message);}
  };
  for(const key of RECORD_KEYS){const option=document.createElement('option');option.value=key;option.textContent=RECORD_LABELS[key];find('category').appendChild(option);}
  for(const id of ['search','category','sort'])find(id).addEventListener(id==='search'?'input':'change',render);
  find('select-visible').onchange=()=>{for(const {key,record} of visible){const token=key+'/'+record.id;if(find('select-visible').checked)selected.set(token,{key,id:record.id});else selected.delete(token);}updateSelection();};
  find('export').onclick=()=>{try{downloadRecordSelection(createSelectedRecordBackup(selection()));status('选中备份已导出；在5.21及以上合并导入，旧版拒绝该格式。');}catch(e){status('导出失败：'+e.message);}};
  find('delete').onclick=()=>{const items=selection();if(!items.length||!confirm('删除已选的'+items.length+'条记录（可能包含筛选外的记录）？请先导出需要保留的内容。'))return;try{deleteRecordEntries(items);selected.clear();refreshRecordViews();render();status('已删除'+items.length+'条；API设置和AI草稿不受影响。');}catch(e){status(e.message);}};
  find('clear').onclick=()=>{if(!confirm('清空全部五类排盘记录及旧版主记录？API设置、AI草稿和已导出的文件单独管理；此操作无法撤销。'))return;try{clearAllRecordEntries();selected.clear();refreshRecordViews();render();status('五类排盘记录已清空。');}catch(e){status(e.message);}};
  find('close').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close();};overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const controls=[...card.querySelectorAll('input,select,textarea,button')].filter(x=>!x.disabled),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  document.body.appendChild(overlay);render();find('search').focus();
}
