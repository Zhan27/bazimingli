/** Learning/inspection only: no storage mutation, AI request or third-party endpoint. */
function studyDownload(data,name){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showStudyWorkspace(chart,{periodIndex,reading}={}){
  if(document.querySelector('.study-workspace-overlay'))return;
  const facts=chartStudyFacts(chart),previous=document.activeElement,overlay=document.createElement('div'),card=document.createElement('div');
  overlay.className='workspace-dialog study-workspace-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','study-title');card.className='workspace-dialog-card study-workspace-card';overlay.appendChild(card);
  card.innerHTML='<div class="study-dialog-heading"><div><span class="study-eyebrow">细读盘面 / STUDY DESK</span><h2 id="study-title">四柱学习与核验</h2></div><button type="button" class="btn btn-ghost" id="study-close">关闭</button></div><div class="study-tabs" role="tablist" aria-label="学习与核验内容"></div><section id="study-panel-facts" role="tabpanel" aria-labelledby="study-tab-facts"></section><section id="study-panel-timeline" role="tabpanel" aria-labelledby="study-tab-timeline" hidden></section><section id="study-panel-compare" role="tabpanel" aria-labelledby="study-tab-compare" hidden></section><div class="study-export-bar"><p>导出的本盘数据含出生时刻、地点与盘面，请妥善保管；不含API设置。</p><button type="button" class="btn btn-ghost" id="study-export">导出本盘数据</button></div>';
  const find=id=>card.querySelector('#study-'+id),el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
  const close=()=>{overlay.remove();previous?.focus();};find('close').onclick=close;
  const tabs=[['facts','四柱细读'],['timeline','大运流年'],['compare','离线对照']].map(([id,title],i)=>{
    const button=el('button',title);button.type='button';button.id='study-tab-'+id;button.setAttribute('role','tab');button.setAttribute('aria-controls','study-panel-'+id);button.setAttribute('aria-selected',String(i===0));button.tabIndex=i===0?0:-1;
    button.onclick=()=>{tabs.forEach(b=>{const on=b===button;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;card.querySelector('#'+b.getAttribute('aria-controls')).hidden=!on;});};card.querySelector('.study-tabs').appendChild(button);return button;
  });
  card.querySelector('.study-tabs').onkeydown=event=>{const index=tabs.indexOf(document.activeElement);if(index<0)return;const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;if(next!==null){event.preventDefault();tabs[next].click();tabs[next].focus();}};
  const factPanel=find('panel-facts');factPanel.appendChild(el('p','以日干观察十神与十二长生；每柱空亡统一参照'+facts.kongWang.xun+'，空亡支为'+facts.kongWang.branches.join('、')+'。','study-note-line'));
  const pillarGrid=el('div',undefined,'study-pillar-grid');
  facts.pillars.forEach((p,i)=>{
    const item=el('article',undefined,'study-pillar'+(i===2?' is-day':''));item.append(el('h3',['年柱','月柱','日柱','时柱'][i]),el('div',p.text,'study-glyphs'));
    const list=el('dl');
    for(const [label,value] of [['干十神',i===2?'日主 · '+p.tenGod:p.tenGod],['支本气十神',p.branchTenGod],['藏干',p.hidden.map(h=>h.gan+' '+h.tenGod+(h.isMainQi?'（本气）':'')).join(' / ')],['纳音',p.nayin],['十二长生',p.diShi],['日旬空亡',p.isKong?'落空亡':'未落空亡']])list.append(el('dt',label),el('dd',value));
    item.appendChild(list);pillarGrid.appendChild(item);
  });factPanel.appendChild(pillarGrid);
  factPanel.appendChild(el('p','藏干保留原有排列，仅标识本气；中气、余气的次序与权重不在此新增。以上是传统表项，用于学习查阅。','study-note-line'));
  const relations=el('details',undefined,'study-relations'),summary=el('summary','原局关系与参与柱位 · '+facts.relations.length+'组');relations.appendChild(summary);
  const positions={year:'年',month:'月',day:'日',hour:'时'};
  facts.relations.forEach(r=>relations.appendChild(el('p',r.name+' · '+r.positions.map(p=>positions[p.pillar]+(r.lane==='gan'?'干':'支')+p.char).join('、'))));factPanel.appendChild(relations);
  const timeline=find('panel-timeline'),select=el('select');select.id='study-period';select.setAttribute('aria-label','选择大运');
  facts.dayun.periods.forEach(p=>{const option=el('option',p.text+' · '+p.startAge+'—'+p.endAge+'岁');option.value=String(p.index);select.appendChild(option);});
  const selectLabel=el('label','大运 ');selectLabel.htmlFor=select.id;selectLabel.appendChild(select);
  timeline.append(el('p',(facts.dayun.forward?'顺行':'逆行')+' · '+facts.dayun.startYears+'年'+facts.dayun.startMonths+'个月起运。年龄沿用本盘时间轴口径：流年公历年减有效出生公历年。','study-note-line'),selectLabel);
  const years=el('div',undefined,'study-years'),layerNotes=el('div',undefined,'study-layer-notes'),monthHeading=el('h3'),monthNote=el('p','流年干支指该年立春后年柱。以下为立春至下一立春的12个节月；北京时间，含起点、不含终点。','study-note-line'),monthList=el('div',undefined,'study-months');layerNotes.hidden=!reading;timeline.append(years,layerNotes,monthHeading,monthNote,monthList);
  const renderMonths=year=>{
    monthHeading.textContent=year+'年 · 节气流月';monthList.replaceChildren();
    if(reading){
      layerNotes.replaceChildren();const p=facts.dayun.periods[Number(select.value)],d=chart.dayun.dyList[p.index],[g,z]=indexToGZ(year-4);
      layerNotes.append(el('p','原局 · '+reading.pattern+'，'+reading.state));
      for(const [layer,title,gan,zhi] of [['dayun','大运 '+p.text,d.g,d.z],['annual','流年 '+year+' '+GAN[g]+ZHI[z],g,z]]){
        const events=mingGeLayerEvents(chart.pillars[2].ganIndex,reading.obstacles,gan,zhi,layer);
        const text=events.length?events.map(e=>e.participant+'（'+e.god+'）→ '+e.target+'；原局'+e.natalState).join('；'):'本层未筛到提纲关节所需的救应字';
        layerNotes.append(el('p',title+' · '+text));
      }
      const source=el('a','制化与救应出处 ↗');source.href=READING_SOURCES.rescue.url;source.target='_blank';source.rel='noopener noreferrer';layerNotes.appendChild(source);
    }
    years.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.studyYear===String(year))));
    try{
      const months=chartStudyMonths(chart,year).months;
      months.forEach(m=>{const item=el('article');item.append(el('h4',m.number+' · '+m.jieQi+' / '+m.text),el('p',m.tenGod+' · '+m.nayin),el('p',m.startClock.replace('T',' ')+' 起'),el('p',m.endClock.replace('T',' ')+' 止'));monthList.appendChild(item);});
    }catch(e){monthList.appendChild(el('p',e.message));}
  };
  const renderYears=()=>{
    years.replaceChildren();const p=facts.dayun.periods[Number(select.value)];
    p.years.forEach(y=>{const button=el('button');button.type='button';button.dataset.studyYear=String(y.year);button.setAttribute('aria-label',y.year+'年 '+y.text+' '+y.age+'岁');button.append(el('span',y.year+' · '+y.age+'岁'),el('b',y.text),el('small',y.tenGod+' / '+y.nayin));button.onclick=()=>renderMonths(y.year);years.appendChild(button);});
    renderMonths(p.years.find(y=>y.year===beijingNow().getFullYear())?.year||p.years[0].year);
  };
  select.value=String(facts.dayun.periods.some(p=>p.index===periodIndex)?periodIndex:facts.dayun.periods.find(p=>p.years.some(y=>y.year===beijingNow().getFullYear()))?.index||0);select.onchange=renderYears;renderYears();
  const compare=find('panel-compare');compare.innerHTML='<p class="study-note-line">选择已保存的对照JSON，在当前设备比较。文件不会上传，也不会写入排盘记录。两边都不是自动认定的标准答案。</p><label class="study-file-label">导入对照JSON<input type="file" id="study-reference-file" accept=".json,application/json"></label><p id="study-compare-status" role="status" aria-live="polite">支持本项目数据/学习快照、四柱数组及已保存的命名四柱响应；最多2MB。</p><div id="study-comparison-result"></div><button type="button" class="btn btn-ghost" id="study-report-export" disabled>导出对照报告</button>';
  let report=null,readId=0;
  const showReport=()=>{
    const target=find('comparison-result');target.replaceChildren();if(!report)return;
    const totals=el('div',undefined,'study-comparison-totals');for(const [key,label] of [['same','一致'],['different','差异'],['not-provided','未提供']]){const count=el('div');count.append(el('b',String(report.summary[key])),el('span',label));totals.appendChild(count);}target.appendChild(totals);
    if(report.warnings.length){const list=el('ul',undefined,'study-warnings');report.warnings.forEach(w=>list.appendChild(el('li',w)));target.appendChild(list);}
    const filterLabel=el('label',undefined,'study-compare-filter'),filter=el('input');filter.type='checkbox';filter.checked=true;filterLabel.append(filter,'仅看差异和未提供项');target.appendChild(filterLabel);
    const wrap=el('div',undefined,'study-comparison-table'),table=el('table'),head=el('thead'),headRow=el('tr');['字段','本盘','对照','状态'].forEach(t=>headRow.appendChild(el('th',t)));head.appendChild(headRow);table.appendChild(head);const body=el('tbody');table.appendChild(body);wrap.appendChild(table);target.appendChild(wrap);
    const text=value=>value===null?'未提供':typeof value==='boolean'?value?'是':'否':Array.isArray(value)?value.join('、'):String(value);
    const render=()=>{body.replaceChildren();const fields=report.fields.filter(f=>!filter.checked||f.status!=='same');fields.forEach(f=>{const row=el('tr');row.dataset.studyCompareStatus=f.status;[f.label,text(f.local),text(f.reference),({same:'一致',different:'差异','not-provided':'未提供'}[f.status])+(f.normalizedAlias?'（异名）':'')].forEach(t=>row.appendChild(el('td',t)));body.appendChild(row);});if(!fields.length){const row=el('tr'),cell=el('td','未发现已提供字段的差异；仍请核对上方口径提示。');cell.colSpan=4;row.appendChild(cell);body.appendChild(row);}};filter.onchange=render;render();
    target.appendChild(el('p','不比较：'+report.excluded.join('、')+'。','study-note-line'));
  };
  find('reference-file').onchange=async event=>{
    const file=event.target.files?.[0],id=++readId;report=null;find('report-export').disabled=true;showReport();if(!file)return;
    try{
      if(file.size>2*1024*1024)throw new RangeError('文件超过2MB');
      const text=await file.text();if(id!==readId||!overlay.isConnected)return;
      report=compareReferenceChart(chart,JSON.parse(text.replace(/^\uFEFF/,'')));find('compare-status').textContent='对照已完成：'+file.name+'。已有字段一致不表示全部规则正确。';find('report-export').disabled=false;showReport();
    }catch(e){if(id!==readId||!overlay.isConnected)return;find('compare-status').textContent='无法对照：'+e.message;}
  };
  find('report-export').onclick=()=>{if(report)studyDownload(report,'命理对照报告.json');};find('export').onclick=()=>studyDownload(createStudySnapshot(chart),'命理学习数据.json');
  overlay.onclick=event=>{if(event.target===overlay)close();};overlay.onkeydown=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
    if(event.key==='Tab'){const controls=[...card.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.tabIndex>=0&&x.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  };
  document.body.appendChild(overlay);if(periodIndex!==undefined){tabs[1].click();tabs[1].focus();}else tabs[0].focus();
}
