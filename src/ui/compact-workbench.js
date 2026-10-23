/** Compact presentation adapters. Keep original controls, handlers and full detail DOM intact. */
let compactChartSeen=false;
function compactPillarTable(zh){
  const facts=chartStudyFacts(serializeChart(zh)),escape=gzRelEscape;
  const rows=[
    ['十神',(p,i)=>tterm(i===2?'日主':p.tenGod)],
    ['干支',(p,i)=>{const [g,z]=zh.pillars[i],gc=WUXING_CLS[WUXING[GAN_WX[g]]],zc=WUXING_CLS[WUXING[ZHI_WX[z]]];return `<span style="color:var(--c-${gc})">${p.gan}</span><span style="color:var(--c-${zc})">${p.zhi}</span>`;},'compact-glyphs'],
    ['支神',p=>tterm(p.branchTenGod)],
    ['藏干',p=>p.hidden.map(h=>`<span><b>${h.gan}</b> ${tterm(h.tenGod)}</span>`).join(''),'compact-hidden'],
    ['纳音',p=>escape(p.nayin)],['长生',p=>tterm(p.diShi)],['空亡',p=>p.isKong?tterm('空亡'):'—'],
    ['司令',(_p,i)=>{const sl=i===1?siLingInfo(zh.date,zh.monthGZ[1]):null;return sl?`${GAN[sl.cur]} <small class="compact-command-note">节后${sl.pass}日</small>`:'—';}]
  ];
  return `<table class="compact-pillar-table"><caption class="sr-only">四柱综合信息，以日干观察十神、长生与日旬空亡</caption><thead><tr><th scope="col">柱位</th>${facts.pillars.map((p,i)=>`<th scope="col"${i===2?' class="compact-day"':''}>${['年柱','月柱','日柱','时柱'][i]}${i===2?' · 日主':''}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,render,cls=''])=>`<tr><th scope="row">${label}</th>${facts.pillars.map((p,i)=>`<td class="${cls}${i===2?' compact-day':''}">${render(p,i)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function compactWorkbenchChart(root,first){
  if(!first||!lastZh)return;
  const page=root.querySelector('#zh-sec-1'),details=document.createElement('details');details.className='compact-original reference-disclosure';details.open=workbenchMode()==='professional';details.innerHTML='<summary>完整四柱表项、藏干权重、五行流通与喜用神</summary>';
  for(const child of [...first.children])details.appendChild(child);
  const heading=document.createElement('h3');heading.textContent='四柱综合盘';first.appendChild(heading);
  const table=document.createElement('div');table.className='compact-table-wrap';table.innerHTML=compactPillarTable(lastZh);first.append(table,details);
  const overview=document.createElement('section');overview.className='compact-overview';
  const statistics=lastZh.wxStatistics;
  overview.innerHTML=`<section class="compact-elements"><h3>五行分布 <small>${gzRelEscape(statistics.name)} · ${statistics.total}位</small></h3><div class="compact-counts">${WUXING.map((w,i)=>`<span style="color:var(--c-${WUXING_CLS[w]})">${w}<b>${statistics.counts[i]}</b></span>`).join('')}</div><p>${gzRelEscape(lastZh.strengthType)} · 用神${WUXING[lastZh.yongShen]} <button type="button" class="btn btn-ghost" data-compact-details>计算与流通明细 ↗</button></p></section>`;
  const relations=page.querySelector('.gz-summary');if(relations)overview.appendChild(relations);
  first.after(overview);
  overview.querySelector('[data-compact-details]').onclick=()=>{details.open=true;details.scrollIntoView({block:'start',behavior:'smooth'});};
  const periods=document.createElement('section');periods.className='compact-period-overview';
  periods.innerHTML=`<h3>大运速览 <small>${lastZh.dy.startAge}岁起运 · ${lastZh.dy.forward?'顺行':'逆行'}</small></h3><div class="compact-periods">${lastZh.dy.dyList.map((d,i)=>`<button type="button" data-compact-period="${i}" aria-pressed="false" aria-label="查看第${i+1}步${GAN[d.g]}${ZHI[d.z]}大运，${d.age}至${d.endAge}岁"><b>${GAN[d.g]}${ZHI[d.z]}</b><span>${d.age}—${d.endAge}岁</span><small>${lastZh.date.getFullYear()+d.age}起</small></button>`).join('')}</div>`;
  const dayunBlock=[...root.querySelectorAll('#zh-sec-2 .section-block')].find(block=>block.querySelector('h3')?.textContent.includes('大运总览')),dayunRows=[...(dayunBlock?.querySelectorAll('tbody tr')||[])];
  overview.after(periods);periods.querySelectorAll('button').forEach(b=>b.onclick=()=>{zhSecGo(2);const index=Number(b.dataset.compactPeriod),target=dayunRows[index];periods.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));dayunRows.forEach(row=>row.classList.toggle('compact-selected-period',row===target));if(target){target.tabIndex=-1;target.scrollIntoView({block:'center',behavior:'smooth'});target.focus({preventScroll:true});}else root.querySelector('#zh-sec-2').scrollIntoView({block:'start',behavior:'smooth'});});
  const toolbar=root.querySelector('.chart-toolbar');if(toolbar){
    const more=document.createElement('details');more.className='compact-more';more.innerHTML='<summary>更多 ···</summary><div class="compact-more-menu"></div>';
    const menu=more.querySelector('div');for(const b of [...toolbar.querySelectorAll('button')])if(b.id!=='study-open')menu.appendChild(b);
    toolbar.appendChild(more);menu.addEventListener('click',e=>{if(e.target.closest('button'))more.open=false;});
    toolbar.querySelector('#study-open')?.addEventListener('click',()=>{more.open=false;});
  }
  const title=root.querySelector('.result-title');if(title){const name=document.createElement('span');name.className='compact-chart-name';name.textContent=lastName||'综合命盘';title.replaceChildren(name);}
  if(title&&toolbar){const heading=document.createElement('div');heading.className='compact-result-heading';title.before(heading);heading.append(title,toolbar);}
  root.querySelector('.reader-mode')&&first.querySelector('h3').appendChild(root.querySelector('.reader-mode'));
  const nav=root.querySelector('#zh-sec-nav');if(nav){const buttons=[...nav.querySelectorAll('button')];buttons.forEach(b=>b.tabIndex=b.classList.contains('active')?0:-1);nav.addEventListener('click',()=>buttons.forEach(b=>b.tabIndex=b.classList.contains('active')?0:-1));nav.addEventListener('keydown',e=>{const i=buttons.indexOf(document.activeElement),next=e.key==='ArrowRight'?(i+1)%buttons.length:e.key==='ArrowLeft'?(i+buttons.length-1)%buttons.length:e.key==='Home'?0:e.key==='End'?buttons.length-1:null;if(i>=0&&next!==null){e.preventDefault();buttons[next].click();buttons[next].focus();}});}
  const entry=document.getElementById('compact-entry'),summary=document.getElementById('compact-input-summary');
  if(summary)summary.textContent=fmtLocalDate(lastZh.inputDate||lastZh.date)+' · '+(lastZh.time||HOUR_NAMES[lastZh.hourIdx])+(lastZh.place?' · '+lastZh.place:'');
  if(entry&&compactChartSeen&&window.innerWidth<=900){entry.open=false;root.scrollIntoView({behavior:'smooth',block:'start'});}compactChartSeen=true;
}
function initializeCompactWorkbench(){
  const form=document.querySelector('.entry-column .form-card'),entry=document.createElement('details');entry.id='compact-entry';entry.open=true;entry.className='compact-entry';
  const summary=document.createElement('summary');summary.innerHTML='<span>出生资料<small id="compact-input-summary">历法 · 时间 · 地点</small></span><span class="compact-edit-label">修改 ＋</span>';form.before(entry);entry.append(summary,form);form.querySelector('h2').classList.add('sr-only');
  const edit=()=>{document.querySelector('.tab[data-tab="zonghe"]').click();entry.open=true;entry.scrollIntoView({block:'start',behavior:'smooth'});document.getElementById('zh-name').focus({preventScroll:true});};
  const mobile=document.createElement('nav');mobile.className='compact-mobile-actions';mobile.setAttribute('aria-label','手机常用操作');mobile.innerHTML='<button type="button" class="btn btn-ghost" id="compact-edit">修改资料</button><button type="button" class="btn btn-ghost" id="compact-records">记录</button><button type="button" class="btn btn-primary" id="compact-ai">AI 解读</button>';document.body.appendChild(mobile);
  mobile.querySelector('#compact-edit').onclick=edit;mobile.querySelector('#compact-records').onclick=showRecordManager;mobile.querySelector('#compact-ai').onclick=()=>{if(!lastZh){edit();return;}zhSecGo(4);document.getElementById('zh-sec-4').scrollIntoView({block:'start',behavior:'smooth'});};
  const panel=document.getElementById('panel-zonghe'),update=()=>{mobile.hidden=!panel.classList.contains('active');};new MutationObserver(update).observe(panel,{attributes:true,attributeFilter:['class']});update();
  const settings=document.getElementById('ai-modal');settings.firstElementChild.classList.add('compact-settings-card');settings.addEventListener('keydown',e=>{if(e.key==='Escape'){settings.style.display='none';document.querySelector('.settings-button').focus();}if(e.key==='Tab'){const fields=[...settings.querySelectorAll('button,input,select,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length),first=fields[0],last=fields.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  const settingsButton=document.querySelector('.settings-button');settingsButton.addEventListener('click',()=>{settings.firstElementChild.scrollTop=0;document.getElementById('ai-base').focus({preventScroll:true});});
  document.addEventListener('click',e=>{if(!e.target.closest('.compact-more'))document.querySelectorAll('.compact-more[open]').forEach(d=>d.open=false);});
}
