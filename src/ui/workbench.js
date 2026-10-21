/** Presentation-only enhancement; existing input IDs, data and calculation functions remain authoritative. */
function workbenchMode(){try{return localStorage.getItem('mingli_view_mode')||'study';}catch(e){return 'study';}}
function setWorkbenchMode(mode){
  if(!['study','professional'].includes(mode))return;
  document.body.classList.toggle('study-view',mode==='study');
  try{localStorage.setItem('mingli_view_mode',mode);}catch(e){/* View preference is optional. */}
  const advanced=document.getElementById('advanced-options');if(advanced)advanced.open=mode==='professional';
  document.querySelectorAll('[data-reader-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readerMode===mode)));
  document.querySelectorAll('.rules-disclosure').forEach(d=>{d.open=mode==='professional';});
}
function workbenchToast(message){
  document.querySelector('.ui-toast')?.remove();const el=document.createElement('div');el.className='ui-toast';el.setAttribute('role','status');el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),2800);
}
function showWorkspaceDialog(kind){
  const previous=document.activeElement,overlay=document.createElement('div');overlay.className='workspace-dialog';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  const card=document.createElement('div');card.className='workspace-dialog-card';overlay.appendChild(card);
  const close=()=>{overlay.remove();previous?.focus();};
  const heading=document.createElement('h2');heading.id='workspace-dialog-heading';heading.textContent=kind==='privacy'?'隐私与数据':kind==='knowledge'?'术语小辞典':'从一张命盘开始';card.appendChild(heading);overlay.setAttribute('aria-labelledby',heading.id);
  if(kind==='privacy'){
    for(const text of ['排盘计算在当前设备运行。在线页面的托管服务会收到访问网页所需的网络信息；本项目未添加分析统计或自动上传命盘的功能。','姓名、出生日期、时间、地点和排盘记录可能属于个人信息。保存的记录、主题和偏好存放在当前站点或本地页面的浏览器存储中；同一设备的其他使用者可能读到。','API Key 默认保存在标签页会话存储。浏览器恢复会话可能保留它；只有主动取消会话选项才长期保存。浏览器存储未经加密，使用后请在 AI 设置中清除 Key。存储不可用时只在当前页面内存保留。','仅主动调用 AI 或测试连接时才向配置的 API 地址发送请求。完整解读会发送姓名、出生信息、命盘、知识片段等；中转运营者和上游模型服务商可能接触请求，数据保留取决于其政策。请确认服务地址可信，避免填写不需要的真实姓名。','导出备份和导出图片、复制摘要或 Prompt 都可能包含出生资料。备份不包含 API 设置，但文件和剪贴板由您自行保管；删除本地记录不会删除已导出的文件或服务商保存的数据。','可在记录管理中逐条或全部删除记录；AI 设置中的清除 Key 独立生效。清除浏览器站点数据会同时移除该站点本地记录和偏好，请先保存需要的备份。']){const p=document.createElement('p');p.textContent=text;card.appendChild(p);}
  }else if(kind==='knowledge'){
    const note=document.createElement('p');note.textContent='查阅术语定义与来源状态。原项目的古籍、经验断语尚待逐条核验，请作为学习线索。';card.appendChild(note);
    const search=document.createElement('input');search.className='glossary-search';search.type='search';search.placeholder='搜索十神、藏干、换日……';search.setAttribute('aria-label','搜索术语');card.appendChild(search);
    const results=document.createElement('div');results.className='glossary-results';card.appendChild(results);
    const render=()=>{results.replaceChildren();const rows=searchKnowledge(search.value).slice(0,16);for(const k of rows){const article=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),meta=document.createElement('small');h.textContent=k.title;p.textContent=k.explanation;meta.textContent=k.book+' · '+({ 'citation-pending':'出处待核验','implementation-verified':'应用实现已测试','traditional-unverified':'传统规则未独立核验'}[k.status]||k.status);article.append(h,p,meta);results.appendChild(article);}if(!rows.length)results.textContent='未找到对应条目，试试“十神”或“藏干”。';};search.addEventListener('input',render);render();
  }else{
    const p=document.createElement('p');p.textContent='这是一个面向世界各地传统文化爱好者的学习工具。先核对计算事实，再阅读传统解释。';card.appendChild(p);
    const ol=document.createElement('ol');for(const text of ['填写公历或农历、出生时分。时辰不确定可选择“不确定”，查看全天候选。','海外出生或使用历史夏令时，请展开“排盘设置”核对标准时偏移；真太阳时需要有效地点。','先看四柱、藏干与五行统计，再切换“大运流年”或“多维分析”。点术语可查看解释。','AI 解读需主动配置服务；发送时命盘资料会交给该服务商。软件评分与断语仅作传统文化参考。']){const li=document.createElement('li');li.textContent=text;ol.appendChild(li);}card.appendChild(ol);
  }
  const button=document.createElement('button');button.className='btn btn-primary';button.textContent='返回排盘';button.addEventListener('click',close);card.appendChild(button);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});overlay.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();close();}
    if(e.key==='Tab'){const items=[...card.querySelectorAll('button,input,a[href],select,textarea')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });document.body.appendChild(overlay);(card.querySelector('input')||button).focus();
}
function loadWorkspaceExample(){
  document.querySelector('.tab[data-tab="zonghe"]').click();
  const values={'zh-name':'学习示例','zh-cal':'0','zh-solar':'2024-02-10','zh-hour':'6','zh-time':'12:00','zh-place':'北京','zh-true-sun':'0','zh-unknow-hour':'0','zh-day-boundary':'zi-chu','zh-dst':'0','zh-school2':'0'};
  for(const [id,value] of Object.entries(values))document.getElementById(id).value=value;
  restoreUtcOffset('zh-utc-offset',480);document.getElementById('zh-unknow-hour').dispatchEvent(new Event('change'));zhToggleCal();zhSyncFromSolar();zhCast();workbenchToast('已填入合成学习示例：2024-02-10 12:00');
}
function enhanceWorkbenchChart(){
  const holder=document.getElementById('zh-result'),root=holder?.firstElementChild;if(!root||root.dataset.workbenchReady)return;
  root.dataset.workbenchReady='1';
  if(root.id==='unknown-candidates'){root.classList.add('result');return;}
  const title=root.querySelector('.result-title');
  if(title){const eyebrow=document.createElement('div');eyebrow.className='result-eyebrow';eyebrow.textContent='FOUR PILLARS / 四柱';title.prepend(eyebrow);const chip=document.createElement('span');chip.className='chart-profile';chip.textContent=lastZh?.profile.name||'综合多流派';title.appendChild(chip);}
  const info=root.querySelector('.info-bar'),timing=[...root.children].find(s=>s!==info&&s.textContent.startsWith('输入钟表'));
  if(timing){const details=document.createElement('details');details.className='time-notes';details.open=workbenchMode()==='professional';const summary=document.createElement('summary');summary.textContent='出生时刻与换日规则 · '+(lastZh?.temporal.civilDate?fmtLocalDate(lastZh.temporal.civilDate):'');const body=document.createElement('div');body.textContent=timing.textContent;details.append(summary,body);info.after(details);timing.remove();}
  const nav=root.querySelector('#zh-sec-nav');
  const toolbar=root.querySelector('button[onclick="shareCopy()"]')?.parentElement;if(toolbar)toolbar.classList.add('chart-toolbar');
  if(nav){nav.setAttribute('role','tablist');nav.setAttribute('aria-label','命盘内容');nav.querySelectorAll('button').forEach(b=>{b.setAttribute('role','tab');b.setAttribute('aria-selected',String(b.classList.contains('active')));b.addEventListener('click',()=>nav.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',String(x===b))));});}
  const page=root.querySelector('#zh-sec-1'),first=page?.querySelector('.pillar-grid')?.closest('.section-block');
  if(first){first.classList.add('primary-pillars');page.prepend(first);const caption=document.createElement('p');caption.className='pillars-caption';caption.textContent='年、月、日、时四柱。颜色对应五行，日柱突出显示。';first.querySelector('h3')?.after(caption);}
  const rules=root.querySelector('[data-calculation-basis]');
  if(rules&&first){const details=document.createElement('details');details.className='reference-disclosure rules-disclosure';details.open=workbenchMode()==='professional';const summary=document.createElement('summary');summary.textContent='计算规则与五行统计 · '+(lastZh?.strengthType||'核对依据');details.append(summary,rules);first.after(details);}
  const gsg=root.querySelector('#zh-gsg');if(gsg){const d=document.createElement('details');d.className='reference-disclosure';const summary=document.createElement('summary');summary.textContent='断前事参考与时辰核对';gsg.before(d);d.append(summary,gsg);}
  if(page){for(const block of page.children){if(block.classList.contains('section-block')&&block!==first&&/命格总断|五维能量雷达|紫微斗数参考/.test(block.querySelector('h3')?.textContent||''))block.classList.add('reader-extra');}}
  const reader=document.createElement('div');reader.className='reader-mode';reader.append('阅读视图');for(const [value,label] of [['study','学习'],['professional','专业']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.readerMode=value;b.setAttribute('aria-pressed',String(workbenchMode()===value));b.addEventListener('click',()=>setWorkbenchMode(value));reader.appendChild(b);}if(nav)nav.before(reader);
  if(page){const note=document.createElement('p');note.className='study-note';note.textContent='先读盘面，再看解释。五行数量是统计口径，软件评分和传统断语未经现实预测校准。专业视图可展开原有完整内容。';first?.appendChild(note);}
}
function initializeWorkbench(){
  const wrap=document.querySelector('.wrap'),header=wrap.querySelector('header'),tabs=document.querySelector('.tabs');
  const sidebar=document.createElement('aside');sidebar.className='workbench-sidebar';sidebar.setAttribute('aria-label','功能导航');sidebar.innerHTML='<div class="brand-lockup"><span class="brand-seal" aria-hidden="true">玄</span><div><div class="brand-name">玄机命理</div><div class="brand-sub">CHINESE CULTURE / STUDY</div></div></div><p class="nav-caption">排 盘 工 作 台</p>';
  wrap.before(sidebar);sidebar.appendChild(tabs);tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','排盘模块');
  const labels={zonghe:'综合排盘',bazi:'八字排盘',ziwei:'紫微斗数',qimen:'奇门遁甲',liuyao:'六爻卜筮',hehun:'合婚配对'};
  tabs.querySelectorAll('.tab').forEach((tab,i)=>{tab.dataset.navNumber=String(i+1).padStart(2,'0');tab.setAttribute('role','tab');tab.setAttribute('tabindex','0');tab.setAttribute('aria-controls','panel-'+tab.dataset.tab);tab.setAttribute('aria-selected',String(tab.classList.contains('active')));tab.addEventListener('click',()=>{tabs.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',String(x===tab)));document.getElementById('workspace-title').textContent=labels[tab.dataset.tab];document.getElementById('current-module').textContent=labels[tab.dataset.tab];});tab.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();const a=[...tabs.querySelectorAll('.tab')],n=(i+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)+a.length)%a.length;a[n].focus();a[n].click();}});});
  const study=document.createElement('div');study.className='sidebar-study';for(const [label,kind] of [['入门与使用指引','help'],['术语小辞典','knowledge']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>showWorkspaceDialog(kind));study.appendChild(b);}sidebar.appendChild(study);
  const bottom=document.createElement('div');bottom.className='sidebar-bottom';bottom.innerHTML='<span class="status-dot"></span>排盘计算在本地进行<br><a href="https://github.com/Zhan27/bazimingli" target="_blank" rel="noopener">GitHub 开源项目 ↗</a><br>主要由 Codex 辅助开发';sidebar.appendChild(bottom);
  const theme=header.querySelector('.theme-dots'),settings=header.querySelector('button');header.replaceChildren();const path=document.createElement('div');path.className='masthead-path';path.innerHTML='<span>玄机命理</span><span aria-hidden="true">/</span><b id="current-module">综合排盘</b>';const actions=document.createElement('div');actions.className='masthead-actions';settings.classList.add('settings-button');settings.textContent='AI 解读设置';actions.append(theme,settings);header.append(path,actions);
  const intro=document.createElement('section');intro.className='workspace-heading';intro.innerHTML='<div><p class="eyebrow">THE ART OF TIME · 传统文化研习</p><h1 id="workspace-title">综合排盘</h1><p>循四时之序，观干支之理。面向世界各地的传统文化学习者。</p></div><div class="intro-actions"><button type="button" class="btn btn-ghost" id="workspace-help">使用指引</button><button type="button" class="btn btn-ghost" id="workspace-example">试用示例 ↗</button></div>';header.after(intro);document.getElementById('workspace-help').addEventListener('click',()=>showWorkspaceDialog('help'));document.getElementById('workspace-example').addEventListener('click',loadWorkspaceExample);
  const flow=document.createElement('div');flow.className='workspace-flow';flow.innerHTML='<button type="button" data-flow="input"><span>1</span>填写生辰</button><i aria-hidden="true">—</i><button type="button" data-flow="chart"><span>2</span>核对命盘</button><i aria-hidden="true">—</i><button type="button" data-flow="study"><span>3</span>阅读与学习</button>';intro.after(flow);flow.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.flow==='study'){showWorkspaceDialog('help');return;}const id=b.dataset.flow==='input'?'zh-name':'zh-result';document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'});if(id==='zh-name')document.getElementById(id).focus();}));
  const panel=document.getElementById('panel-zonghe'),form=panel.querySelector('.form-card'),row=form.querySelector('.form-row'),records=document.getElementById('zh-records-wrap'),entry=document.createElement('aside');entry.className='entry-column';entry.setAttribute('aria-label','出生资料与本地记录');panel.prepend(entry);entry.append(form,records);
  form.querySelector('h2').innerHTML='出生资料<span>填写原始钟表时间，核对历法与时区</span>';
  const advanced=document.createElement('details');advanced.id='advanced-options';advanced.className='advanced-options';advanced.innerHTML='<summary>排盘设置 <span>时区 · 流派 · 换日</span></summary><div class="advanced-grid"></div>';const grid=advanced.querySelector('.advanced-grid');
  for(const id of ['zh-utc-offset','zh-dst','zh-day-boundary','zh-minute','zh-true-sun','zh-wx-mode','zh-school2','zh-check-past','zh-zw-ref']){const field=document.getElementById(id).closest('.field');grid.appendChild(field);if(['zh-check-past','zh-zw-ref','zh-school2'].includes(id))field.classList.add('field-wide');}
  document.getElementById('zh-place').closest('.field').classList.add('field-wide');
  const actionRow=document.createElement('div');actionRow.className='entry-actions';for(const b of [...row.querySelectorAll(':scope > button')])actionRow.appendChild(b);row.append(advanced,actionRow);
  const help=document.createElement('p');help.className='advanced-help';help.textContent='默认东八区、无夏令时。海外出生与临界时刻请按实际情况调整；不会自动查询历史时区。';advanced.appendChild(help);
  const tip=form.querySelector('.tip');if(tip){const d=document.createElement('details');d.className='input-guidance';d.innerHTML='<summary>时间精度与输入说明</summary>';tip.classList.add('note');tip.before(d);d.appendChild(tip);}
  const search=document.createElement('input');search.type='search';search.className='glossary-search';search.style.cssText='margin-bottom:6px;font-size:10px;padding:7px 8px';search.placeholder='搜索本地记录';search.setAttribute('aria-label','搜索本地排盘记录');records.querySelector('#zh-records').before(search);search.addEventListener('input',()=>records.querySelectorAll('.rec-item').forEach(r=>{r.hidden=!r.textContent.toLowerCase().includes(search.value.toLowerCase());}));
  document.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('label'),control=field.querySelector('input,select,textarea');if(label&&control?.id&&!label.querySelector('input'))label.htmlFor=control.id;});
  const footer=document.createElement('footer');footer.className='app-footer';footer.innerHTML='传统文化学习与参考 · 计算事实与传统解释请分别理解<br>由 <a href="https://github.com/Zhan27/bazimingli" target="_blank" rel="noopener">Zhan27</a> 维护，主要借助 OpenAI Codex 开发 · <button class="btn btn-ghost" type="button" id="footer-knowledge" style="font-size:10px;padding:2px 6px;min-height:0">查阅术语</button>';wrap.appendChild(footer);document.getElementById('footer-knowledge').addEventListener('click',()=>showWorkspaceDialog('knowledge'));
  const privacy=document.createElement('button');privacy.className='btn btn-ghost';privacy.type='button';privacy.id='footer-privacy';privacy.textContent='隐私与数据';privacy.style.cssText='font-size:10px;padding:2px 6px;min-height:0';privacy.addEventListener('click',()=>showWorkspaceDialog('privacy'));footer.appendChild(privacy);
  setWorkbenchMode(workbenchMode());enhanceWorkbenchChart();new MutationObserver(enhanceWorkbenchChart).observe(document.getElementById('zh-result'),{childList:true});
}
