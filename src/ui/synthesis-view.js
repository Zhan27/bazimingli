function mingGeEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function readingCitations(keys){
  return '<details class="reading-citations"><summary>典籍与规则出处</summary>'+[...new Set(keys)].map(key=>{
    const s=READING_SOURCES[key];return '<div><a target="_blank" rel="noopener noreferrer" href="'+mingGeEscape(s.url)+'">《'+mingGeEscape(s.book)+'》·'+mingGeEscape(s.chapter)+' ↗</a>'+(s.quote?'<q>'+mingGeEscape(s.quote)+'</q>':'')+'<small>核对范围：'+mingGeEscape(s.scope)+'</small></div>';
  }).join('')+'<small>释义与线索筛选为应用整理；文献位置核对于 2026-10-23。</small></details>';
}
function mingGeSummaryBody(zh){
  const s=buildMingGeSummary(zh),esc=mingGeEscape;
  const evidence=rows=>[...new Map(rows.map(n=>[n.id,n])).values()].map(n=>'<button type="button" class="mingge-locate" data-mingge-node="'+(n.id.includes('.hidden.')?'zhi':'gan')+'-'+n.pillar+'" aria-label="在关系图定位'+esc(n.label)+'">'+esc(n.label)+'·'+esc(SHISHEN_NAME[n.god])+' ↗</button>').join('；');
  const row=(label,text)=>'<div class="mingge-row"><b>'+esc(label)+'</b><span>'+text+'</span></div>';
  const paths=s.paths.length?s.paths.map(p=>esc(p.title)+' <small>'+esc(p.state)+'</small>').join(' · '):'先察财官食印的承接';
  const issue=s.obstacles.length?s.obstacles.map(o=>esc(o.title)+' <small>'+esc(o.resolution)+'</small>').join(' · '):'当前筛选未见提纲对应的明透阻力';
  const climate=s.useGod.climate?'；调候'+esc(s.useGod.climate)+(s.useGod.conflict?'，与扶抑分列':'，与扶抑同向'):'';
  let html='<div class="mingge-chips"><span>提纲 <b>'+esc(s.pattern)+'</b></span><span>旺衰 <b>'+esc(s.strength)+'</b></span><span>配合 <b>'+esc(s.state)+'</b></span></div><p class="mingge-headline">'+esc(s.headline)+'</p>';
  html+=row('承接',paths)+row('关节',issue)+row('取用',esc(s.useGod.profile)+' · 当前取'+esc(s.useGod.selected)+'；扶抑参考'+esc(s.useGod.balance)+climate);
  html+='<details class="mingge-evidence"><summary>总断依据 · 柱位、透藏与救应</summary>';
  html+=row('月令',esc(s.month.branch)+'藏'+s.month.candidates.map(n=>esc(GAN[n.gan])+'（'+esc(SHISHEN_NAME[n.god])+'，'+(n.exposed?'透干':'藏支')+'）').join('、')+'。以本气建立提纲；杂气透出与会支另看。');
  html+=row('根气',s.roots.length?evidence(s.roots):'四支藏干未见日主同五行根');
  html+=row('明透',evidence(s.visible));
  for(const p of s.candidates){
    html+='<details class="mingge-candidate" data-mingge-path="'+esc(p.id)+'"><summary>'+esc(p.title)+' · '+esc(p.state)+(p.missing.length?' · 缺'+p.missing.length+'项':'')+'</summary><p>'+esc(p.detail)+'</p>';
    for(const c of p.checks)html+=row(c.title,'<strong data-condition-status="'+c.status+'">'+({met:'满足',missing:'未满足',pending:'待察'}[c.status])+'</strong> <small>'+({required:'必要条件',supporting:'承接条件',review:'力量复核'}[c.kind])+'</small>'+(c.evidence.length?' · '+evidence(c.evidence):''));
    if(p.missing.length)html+=row('缺项',esc(p.missing.join('、')));
    for(const b of p.blocking)html+=row('伴随关节',esc(b.title)+' · '+esc(b.state)+'；'+evidence(b.evidence)+(b.counterEvidence.length?'；救应受牵：'+evidence(b.counterEvidence):''));
    html+='</details>';
  }
  for(const o of s.obstacles){
    html+=row(o.title,evidence(o.evidence)+'。'+esc(o.detail));
    for(const r of o.remedies)html+=row('救应·'+r.title,'<strong>'+esc(r.state)+'</strong> '+(r.evidence.length?evidence(r.evidence):'当前四柱未见')+(r.counterEvidence?.length?'；受牵线索：'+evidence(r.counterEvidence):''));
  }
  if(s.relations.length)html+=row('月支联动',s.relations.map(r=>esc(r.name)+'（'+esc(r.positions.join('、'))+'）').join('；')+'。合、冲、刑与提纲配合分列，不按关系条数判破格。');
  html+='</details><details class="mingge-transits"><summary>行运看点 · 运中补字与引动</summary>';
  html+=s.transits.length?s.transits.map(d=>row(d.text+' '+d.age+'–'+d.endAge+'岁','<small>'+d.startYear+'—'+d.endYear+'年 · 大运层</small><br>'+[d.matching.length?'当前取用'+esc(s.useGod.selected)+'见于'+esc(d.matching.join('、')):'',...d.events.map(e=>esc(e.participant)+'（'+esc(e.god)+'）→ '+esc(e.target)+'；原局'+esc(e.natalState))].filter(Boolean).join('；')+' <button type="button" class="mingge-locate" data-mingge-period="'+d.index+'">按运年细读 ↗</button>')).join(''):'<p>已排大运中未筛到对应取用或救应字；可继续查看完整大运。</p>';
  html+='</details>'+readingCitations(s.sources);
  return html;
}
function mountMingGeInteractions(root,zh){
  if(root.mingGeClick)root.removeEventListener('click',root.mingGeClick);
  // Capture this rendered chart rather than reading a later global chart from a stale control.
  root.mingGeClick=event=>{
    const node=event.target.closest('[data-mingge-node]'),period=event.target.closest('[data-mingge-period]');
    if(node){const chart=Object.fromEntries(['year','month','day','hour'].map((id,i)=>[id+'GZ',zh.pillars[i]]));showGanZhiWorkspace(chart,'all',node.dataset.minggeNode);}
    if(period)showStudyWorkspace(serializeChart(zh),{periodIndex:Number(period.dataset.minggePeriod),reading:buildMingGeSummary(zh)});
  };root.addEventListener('click',root.mingGeClick);
}
