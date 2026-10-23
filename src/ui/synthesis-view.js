function mingGeEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function readingCitations(keys){
  return '<details class="reading-citations"><summary>典籍与规则出处</summary>'+[...new Set(keys)].map(key=>{
    const s=READING_SOURCES[key];return '<div><a target="_blank" rel="noopener noreferrer" href="'+mingGeEscape(s.url)+'">《'+mingGeEscape(s.book)+'》·'+mingGeEscape(s.chapter)+' ↗</a>'+(s.quote?'<q>'+mingGeEscape(s.quote)+'</q>':'')+'<small>核对范围：'+mingGeEscape(s.scope)+'</small></div>';
  }).join('')+'<small>释义与线索筛选为应用整理；文献位置核对于 2026-10-23。</small></details>';
}
function mingGeSummaryBody(zh){
  const s=buildMingGeSummary(zh),esc=mingGeEscape;
  const evidence=rows=>rows.map(n=>esc(n.label)+'·'+esc(SHISHEN_NAME[n.god])).join('；');
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
  for(const p of s.paths)html+=row(p.title,evidence(p.evidence)+'。'+esc(p.detail));
  for(const o of s.obstacles){
    html+=row(o.title,evidence(o.evidence)+'。'+esc(o.detail));
    for(const r of o.remedies)html+=row('救应·'+r.title,'<strong>'+esc(r.state)+'</strong> '+(r.evidence.length?evidence(r.evidence):'当前四柱未见')+(r.counterEvidence?.length?'；受牵线索：'+evidence(r.counterEvidence):''));
  }
  if(s.relations.length)html+=row('月支联动',s.relations.map(r=>esc(r.name)+'（'+esc(r.positions.join('、'))+'）').join('；')+'。合、冲、刑与提纲配合分列，不按关系条数判破格。');
  html+='</details><details class="mingge-transits"><summary>行运看点 · 运中补字与引动</summary>';
  html+=s.transits.length?s.transits.map(d=>row(d.text+' '+d.age+'–'+d.endAge+'岁',[d.matching.length?'当前取用'+esc(s.useGod.selected)+'见于'+esc(d.matching.join('、')):'',...d.triggered.map(esc)].filter(Boolean).join('；'))).join(''):'<p>已排大运中未筛到对应取用或救应字；可继续查看完整大运。</p>';
  html+='</details>'+readingCitations(s.sources);
  return html;
}
