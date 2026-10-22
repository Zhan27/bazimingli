/** Presentation only: preserve zhGanZhiMap's rule results and resolve every participant by pillar. */
const GZ_RELATION_TYPES={he:'合',chong:'冲',sanhe:'三合',xing:'刑',hai:'害',po:'破',anhe:'暗合'};
function gzRelationModel(zh,relations=zhGanZhiMap(zh)){
  const pillars=['年','月','日','时'],values=[zh.yearGZ,zh.monthGZ,zh.dayGZ,zh.hourGZ];
  const nodes=['gan','zhi'].flatMap((lane)=>values.map((value,column)=>({
    id:lane+'-'+column,lane,column,pillar:pillars[column],char:(lane==='gan'?GAN:ZHI)[value[lane==='gan'?0:1]]
  })));
  const rows=relations.map((relation,index)=>{
    const lane=relation.t.startsWith('天干')?'gan':'zhi',candidates=nodes.filter(n=>n.lane===lane);
    const explicit=[...(relation.from+'·'+relation.to).matchAll(/([年月日时])([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥])/g)];
    // Group rules have no pillar names; include all occurrences, not just the first matching character.
    const members=candidates.filter(n=>explicit.length?explicit.some(m=>m[1]===n.pillar&&m[2]===n.char):(relation.from+relation.to).includes(n.char));
    return {...relation,id:String(index),lane,members};
  });
  return {nodes,rows};
}
function gzRelEscape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function gzRelationRail(row){
  const xs=[49.5,148.5,247.5,346.5],members=row.members;
  let svg=xs.map(x=>`<line class="gz-rail-guide" x1="${x}" x2="${x}" y1="2" y2="58"/>`).join('');
  for(let i=1;i<members.length;i++){
    const a=xs[members[i-1].column]+19,b=xs[members[i].column]-19;
    svg+=`<path class="gz-rail-link" d="M ${a} 30 C ${a+22} 13, ${b-22} 13, ${b} 30"/>`;
  }
  svg+=members.map(n=>`<g data-gz-endpoint="${n.id}"><rect class="gz-rail-node" x="${xs[n.column]-18}" y="12" width="36" height="36" rx="10"/><text x="${xs[n.column]}" y="36" text-anchor="middle">${gzRelEscape(n.char)}</text></g>`).join('');
  return `<svg class="gz-rail" viewBox="0 0 396 60" aria-hidden="true" focusable="false">${svg}</svg>`;
}
function renderGanZhiRelations(zh){
  const {nodes,rows}=gzRelationModel(zh),escape=gzRelEscape;
  const filters=Object.entries(GZ_RELATION_TYPES).filter(([type])=>rows.some(r=>r.cls===type)).map(([type,label])=>
    `<button type="button" class="gz-type gz-type-${type}" data-gz-type="${type}" aria-pressed="false"><i aria-hidden="true"></i>${label}<span>${rows.filter(r=>r.cls===type).length}</span></button>`).join('');
  const lanes=['gan','zhi'].map(lane=>{
    const laneName=lane==='gan'?'天干':'地支',laneRows=rows.filter(r=>r.lane===lane);
    const heading=nodes.filter(n=>n.lane===lane).map(n=>`<button type="button" class="gz-pillar" data-gz-node="${n.id}" aria-pressed="false" aria-label="筛选${n.pillar}${laneName==='天干'?'干':'支'}${n.char}参与的关系"><span>${n.pillar}柱</span><b>${n.char}</b></button>`).join('');
    const items=laneRows.map(row=>{
      const description=row.t+' · '+row.name+' · '+row.members.map(n=>n.pillar+(lane==='gan'?'干':'支')+n.char).join('、');
      return `<button type="button" class="gz-relation gz-type-${row.cls}" data-gz-relation="${row.id}" data-gz-kind="${row.cls}" data-gz-members="${row.members.map(n=>n.id).join(',')}" data-gz-description="${escape(description)}" aria-label="${escape(description)}" aria-pressed="false"><span class="gz-relation-caption"><span class="gz-relation-kind">${escape(row.t)}</span><strong>${escape(row.name)}</strong></span>${gzRelationRail(row)}</button>`;
    }).join('');
    return `<section class="gz-lane" data-gz-lane="${lane}" aria-label="${laneName}关系"><div class="gz-lane-heading"><div><h4>${laneName}</h4><span data-gz-lane-count>${laneRows.length}组关系</span></div><div class="gz-pillars">${heading}</div></div><div class="gz-lane-rows">${items}</div><p class="gz-lane-empty"${laneRows.length?' hidden':''}>${laneRows.length?'当前筛选下无关系':'本盘未检出'+laneName+'关系'}</p></section>`;
  }).join('');
  return `<section class="gz-explorer" aria-label="干支互动"><header class="gz-heading"><div><span class="gz-eyebrow">四柱关系 / CONNECTIONS</span><h3>干支互动 <small>${rows.length}组</small></h3></div><button type="button" class="gz-reset" data-gz-reset>重置筛选</button></header><p class="gz-intro">每行一组关系，连线对齐年、月、日、时。点击干支可筛选，点击关系可高亮。</p><div class="gz-filters" role="group" aria-label="按关系类型筛选"><button type="button" class="gz-type" data-gz-type="all" aria-pressed="true">全部<span>${rows.length}</span></button>${filters}</div><div class="gz-lanes">${lanes}</div><p class="gz-status" role="status" aria-live="polite" data-gz-status>显示全部${rows.length}组关系</p><p class="gz-footnote">三合、相刑按同组连接；重复的字保留各自柱位。<button type="button" class="gz-reset" data-gz-glossary>查阅关系术语</button></p></section>`;
}
function mountGanZhiRelations(holder){
  holder.querySelectorAll('.gz-explorer').forEach(root=>{
    if(root.dataset.gzMounted)return;root.dataset.gzMounted='true';
    const rows=[...root.querySelectorAll('[data-gz-relation]')],nodes=[...root.querySelectorAll('[data-gz-node]')],types=[...root.querySelectorAll('[data-gz-type]')],status=root.querySelector('[data-gz-status]');
    let type='all',node='',selected=null;
    const members=row=>(row?.dataset.gzMembers||'').split(',');
    const highlight=row=>{
      nodes.forEach(n=>n.classList.toggle('is-related',members(row).includes(n.dataset.gzNode)));
      rows.forEach(r=>r.classList.toggle('is-related',r===row));
      status.textContent=row?row.dataset.gzDescription:`显示${rows.filter(r=>!r.hidden).length} / ${rows.length}组关系`;
    };
    const update=()=>{
      types.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gzType===type)));
      nodes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gzNode===node)));
      rows.forEach(r=>{r.hidden=(type!=='all'&&r.dataset.gzKind!==type)||(!!node&&!members(r).includes(node));});
      if(selected?.hidden){selected.setAttribute('aria-pressed','false');selected=null;}
      root.querySelectorAll('[data-gz-lane]').forEach(lane=>{
        const visible=[...lane.querySelectorAll('[data-gz-relation]')].filter(r=>!r.hidden).length;
        lane.querySelector('[data-gz-lane-count]').textContent=visible+'组关系';lane.querySelector('.gz-lane-empty').hidden=visible>0;
      });highlight(selected);
    };
    types.forEach(b=>b.addEventListener('click',()=>{type=b.dataset.gzType;update();}));
    nodes.forEach(b=>b.addEventListener('click',()=>{node=node===b.dataset.gzNode?'':b.dataset.gzNode;update();}));
    rows.forEach(row=>{
      row.addEventListener('click',()=>{selected=selected===row?null:row;rows.forEach(r=>r.setAttribute('aria-pressed',String(r===selected)));highlight(selected);});
      row.addEventListener('mouseenter',()=>highlight(selected||row));row.addEventListener('mouseleave',()=>highlight(selected||(rows.includes(document.activeElement)?document.activeElement:null)));
      row.addEventListener('focus',()=>highlight(selected||row));row.addEventListener('blur',()=>highlight(selected));
    });
    root.querySelector('[data-gz-reset]').addEventListener('click',()=>{type='all';node='';selected=null;rows.forEach(r=>r.setAttribute('aria-pressed','false'));update();});
    root.querySelector('[data-gz-glossary]').addEventListener('click',()=>showWorkspaceDialog('knowledge'));
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){selected=null;rows.forEach(r=>r.setAttribute('aria-pressed','false'));highlight(null);}});
  });
}
