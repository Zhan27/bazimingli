/** Small, shared drill-down shell. No chart calculation lives in these views. */
function showModuleDialog(title,body,setup){
  if(document.querySelector('.module-dialog'))return;
  const previous=document.activeElement,overlay=document.createElement('div'),card=document.createElement('section');
  overlay.className='workspace-dialog module-dialog';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','module-dialog-title');card.className='workspace-dialog-card module-dialog-card';
  card.innerHTML='<div class="module-dialog-heading"><h2 id="module-dialog-title">'+gzRelEscape(title)+'</h2><button type="button" class="btn btn-ghost" data-module-close>关闭</button></div><div class="module-dialog-content">'+body+'</div>';overlay.appendChild(card);
  const close=()=>{overlay.remove();if(previous?.isConnected)previous.focus({preventScroll:true});};
  card.querySelector('[data-module-close]').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close();};
  overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Tab'){const items=[...card.querySelectorAll('button,input,select,summary,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  document.body.appendChild(overlay);if(setup)setup(card,close);card.querySelector('[data-module-close]').focus({preventScroll:true});return card;
}
function mountLiuyaoDetails(root,d){
  root.querySelectorAll('[data-ly-line]').forEach(button=>{button.onclick=()=>{
    const line=d.lines[Number(button.dataset.lyLine)-1],other=d.lines.find(x=>x.position===(line.shi?d.shiYing.ying:d.shiYing.shi)),label=['初','二','三','四','五','上'][line.position-1];
    const flags=[line.shi?'世爻':'',line.ying?'应爻':'',line.kong?'旬空':'',line.monthBroken?'月破':''].filter(Boolean).join(' · ')||'静态爻位';
    showModuleDialog(label+'爻 · 本变对照','<p>'+gzRelEscape(flags)+' · '+(line.moving?'动爻':'静爻')+'</p><div class="module-comparison"><div><h3>本卦</h3><b>'+line.text+' · '+line.qin+'</b><p>'+(line.yang?'阳爻':'阴爻')+' · '+(line.shen||'未定日辰')+'</p></div><div><h3>变卦</h3><b>'+line.changed.text+' · '+line.changed.qin+'</b><p>'+(line.changed.yang?'阳爻':'阴爻')+' · 六亲仍以本卦'+BAGUA[d.shiYing.gong]+'宫五行定位</p></div></div><p>世爻在'+d.shiYing.shi+'爻，应爻在'+d.shiYing.ying+'爻。'+(other?'对应'+other.text+' · '+other.qin+'。':'')+'</p><p>月建'+(d.monthGZ?ZHI[d.monthGZ[1]]:'未定')+'；日辰'+(d.dayGZ?GAN[d.dayGZ[0]]+ZHI[d.dayGZ[1]]:'未定')+'；旬空'+(d.dayGZ?d.xunKong.map(z=>ZHI[z]).join(''):'未定')+'。</p><p class="module-citations">规则查阅：<a href="https://zh.wikisource.org/wiki/梅花易數/卷一" target="_blank" rel="noopener">《梅花易数》取数起卦</a> · <a href="https://www.shidianguji.com/zh/book/HY1394/chapter/1l3wdoooukqb8" target="_blank" rel="noopener">《卜筮全书》起六神诀</a></p>');
  };});
}
function mountQimenDetails(root,d){
  root.querySelectorAll('[data-qm-palace]').forEach(button=>{
    const open=()=>{const p=d.palaces.find(p=>p.number===Number(button.dataset.qmPalace));showModuleDialog(p.name+' · '+p.number+'宫','<dl class="module-facts">'+[['地盘',p.earthlyStem],['天盘',p.heavenlyStem||'随天芮寄转'],['寄干',p.carriedStem||'—'],['九星',p.star],['八门',p.door||'中宫不置门'],['八神',p.spirit||'中宫不置神'],['标记',[p.zhiFu?'值符落宫':'',p.zhiShi?'值使落宫':'',p.void?'旬空':''].filter(Boolean).join(' · ')||'—']].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+gzRelEscape(v)+'</dd></div>').join('')+'</dl><p>符头'+d.juInfo.fuTou.map((n,i)=>[GAN,ZHI][i][n]).join('')+' · '+['上','中','下'][d.juInfo.yuan]+'元 · '+d.juInfo.method+'。旬首'+GAN[d.xunHeadGZ[0]]+ZHI[d.xunHeadGZ[1]]+'遁'+d.xunYi+'，原在'+d.zfGong+'宫。</p><p>值符随时干落'+d.hourGanGong+'宫；值使按旬内时序'+(d.juInfo.yang?'顺':'逆')+'数至'+d.rawMenGong+'宫'+(d.rawMenGong===5?'，中五寄坤二':'')+'。禽随芮，八宫按坎艮震巽离坤兑乾旋转。</p><p class="module-citations"><a href="'+QM_SOURCE+'" target="_blank" rel="noopener">《易学象数论·遁甲》：符头、局数与符使</a> · 规则版本 '+d.rules.version+'</p>');};
    button.onclick=open;if(button.tagName!=='BUTTON')button.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();open();}};
  });
}
function showHehunRelations(r,A,B){
  const body='<p>甲方在上、乙方在下。点柱位筛选，点关系查看浅色连线。</p><div class="module-actions"><button type="button" data-hh-lane="gan" aria-pressed="false">天干</button><button type="button" data-hh-lane="zhi" aria-pressed="true">地支</button><button type="button" data-hh-reset>重置柱位</button></div><div class="hh-relation-board"><svg viewBox="0 0 640 260" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="hh-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 L8 5 L1 9" fill="none" stroke="currentColor" stroke-width="1.6"/></marker></defs><path data-hh-edge fill="none" stroke="currentColor" stroke-width="1.5" opacity=".45" marker-start="url(#hh-arrow)" marker-end="url(#hh-arrow)"/></svg>'+[A,B].map((s,side)=>'<div class="hh-relation-row" data-hh-side="'+side+'">'+s.zh.pillars.map((p,column)=>'<button type="button" data-hh-node="'+side+'-'+column+'" aria-pressed="false"><small>'+['甲','乙'][side]+' · '+['年','月','日','时'][column]+'</small><b data-hh-char>'+ZHI[p[1]]+'</b></button>').join('')+'</div>').join('')+'</div><p data-hh-relation-status role="status"></p><div class="module-actions" data-hh-relations></div><p class="module-citations"><a href="https://zh.wikisource.org/wiki/三命通會/卷二" target="_blank" rel="noopener">《三命通会》卷二：天干五合、地支合冲刑害</a></p>';
  showModuleDialog('双盘柱位关系',body,card=>{
    let lane='zhi',node='',picked='';
    const render=()=>{const rows=r.relations.filter(x=>x.lane===lane&&(!node||(node[0]==='0'?x.left.column:x.right.column)===Number(node[2])));if(!rows.some(x=>x.id===picked))picked=rows[0]?.id||'';const row=rows.find(x=>x.id===picked),edge=card.querySelector('[data-hh-edge]');edge.setAttribute('d',row?'M'+[80,240,400,560][row.left.column]+' 85 C'+[80,240,400,560][row.left.column]+' 130 '+[80,240,400,560][row.right.column]+' 130 '+[80,240,400,560][row.right.column]+' 175':'');card.querySelector('[data-hh-relation-status]').textContent=row?A.name+' '+row.left.label+' ↔ '+B.name+' '+row.right.label+' · '+row.name:'所选柱位暂无'+(lane==='gan'?'五合':'合冲刑害')+'关系';card.querySelector('[data-hh-relations]').innerHTML=rows.map(x=>'<button type="button" data-hh-rel="'+x.id+'" aria-pressed="'+(picked===x.id)+'">'+gzRelEscape(x.left.label+' ↔ '+x.right.label+' '+x.name)+'</button>').join('');card.querySelectorAll('[data-hh-node]').forEach(b=>{const [s,c]=b.dataset.hhNode.split('-').map(Number);b.querySelector('b').textContent=[GAN,ZHI][lane==='gan'?0:1][[A,B][s].zh.pillars[c][lane==='gan'?0:1]];b.setAttribute('aria-pressed',String(node===b.dataset.hhNode));});card.querySelectorAll('[data-hh-lane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hhLane===lane)));};
    card.addEventListener('click',e=>{const l=e.target.closest('[data-hh-lane]'),n=e.target.closest('[data-hh-node]'),p=e.target.closest('[data-hh-rel]');if(l){lane=l.dataset.hhLane;picked='';}else if(n){node=node===n.dataset.hhNode?'':n.dataset.hhNode;picked='';}else if(p)picked=p.dataset.hhRel;else if(e.target.closest('[data-hh-reset]')){node='';picked='';}else return;render();if(p)card.querySelector('[data-hh-rel="'+picked+'"]')?.focus({preventScroll:true});});render();
  });
}

function hhReferenceYear(){
  const raw=document.getElementById('hh-reference-year').value,year=raw===''?beijingNow().getFullYear():Number(raw);
  if(!Number.isInteger(year)||year<1900||year>2099)throw new RangeError('参考年份须为1900至2099');return year;
}
function hhRestoreSide(side,input){
  const prefix='hh'+side+'-',set=(field,value)=>{document.getElementById(prefix+field).value=value;},o=input.options||{};
  set('name',input.name||'');set('date',input.date);set('time',input.time||'');set('hour',input.hourIdx??hourIndexAt(withBirthTime(parseCivilDate(input.date),6,input.time||'12:00')));set('gender',input.gender??1);set('place',input.place||'');set('school',o.schoolId??0);restoreUtcOffset(prefix+'utc-offset',o.utcOffsetMinutes??480);set('dst',o.dstMinutes??0);set('day-boundary',o.dayBoundary??'zi-chu');set('true-solar',o.trueSolar?'1':'0');set('wx-mode',o.wxMode??'stems-main-qi');
}
function hhRecordReload(id){
  try{const record=readStoredRecords(PAIR_REC_KEY).find(r=>r.id===id);if(!record)throw new Error('记录已不存在');hhRestoreSide('1',record.left);hhRestoreSide('2',record.right);document.getElementById('hh-reference-year').value=record.referenceYear;hhCast();}catch(e){document.getElementById('hh-history-status').textContent='恢复失败：'+e.message;}
}
