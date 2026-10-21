let lastCandidates=null;
function readCalculationOptions(prefix='zh',schoolId=0){
  const value=(name,fallback)=>document.getElementById(prefix+'-'+name)?.value??fallback;
  return {preciseTime:true,schoolId,dayBoundary:value('day-boundary',prefix==='bz'?(value('school','0')==='0'?'zi-chu':'zi-zheng'):'zi-chu'),
    utcOffsetMinutes:Number(value('utc-offset','480')),dstMinutes:Number(value('dst','0')),wxMode:value('wx-mode','stems-main-qi')};
}
function initializeCalculationControls(){
  const offsets=Array.from({length:105},(_,i)=>{const value=-720+i*15;return [value,utcOffsetLabel(value)];});
  document.querySelectorAll('[data-utc-offset]').forEach(el=>{
    offsets.forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;el.appendChild(o);});el.value=480;
  });
  document.querySelectorAll('[data-wx-mode]').forEach(el=>{
    Object.entries(WX_MODES).forEach(([value,mode])=>{const o=document.createElement('option');o.value=value;o.textContent=mode.name;el.appendChild(o);});
  });
  const list=document.getElementById('city-options');
  if(list){
    const nodes=CITY_DATA.cities.map(c=>{const o=document.createElement('option');o.value=locationLabel(c);o.label=c.aliases.slice(0,3).join(' / ');return o;});list.replaceChildren(...nodes);
  }
  const unknown=document.getElementById('zh-unknow-hour');
  const update=()=>{const on=unknown.value==='1';['zh-hour','zh-time','zh-minute'].forEach(id=>{document.getElementById(id).disabled=on;});};
  unknown.addEventListener('change',update);update();
}
function restoreUtcOffset(id,value=480){
  const el=document.getElementById(id),text=String(value);
  if(!Array.from(el.options).some(o=>o.value===text)){const o=document.createElement('option');o.value=text;o.textContent=utcOffsetLabel(value);el.appendChild(o);}
  el.value=text;
}
function renderRuleFacts(zh){
  const p=zh.profile||getRuleProfile(0),s=zh.strength||computeStrength(zh.pillars),parts=s.parts;
  const stats=zh.wxStatistics||countWuXing(zh.pillars);
  const names=['年','月','日','时'];
  const roots=parts.roots.entries.map(r=>names[r.pillar]+'支藏'+GAN[r.hiddenGan]+'（'+['本气','中气','余气'][r.qi]+' '+r.base+'＋位置加权'+r.bonus+'）').join('、')||'无生扶通根项';
  const momentum=parts.momentum.entries.map(r=>names[r.pillar]+'干'+GAN[r.gan]+(r.rooted?'通根':'虚浮')+' '+r.value).join('、')||'无印比得势项';
  const table=Object.keys(WX_MODES).map(mode=>{const x=countWuXing(zh.pillars,mode);return '<tr><th>'+x.name+'</th><td>'+WUXING.map((w,i)=>w+x.counts[i]).join(' ')+'</td><td>'+x.total+'</td></tr>';}).join('');
  return '<div class="section-block" data-calculation-basis><h3>计算规则与统计依据</h3><p>'+esc0(p.name+' · '+p.version+' · '+p.focus)+'</p><p>'+esc0(dayBoundaryLabel(zh.temporal?.dayBoundary||p.dayBoundary))+'</p>'+
    '<details><summary>旺衰评分：得令 '+parts.month.value+' ＋ 通根 '+Number(parts.roots.value.toFixed(4))+' ＋ 得势 '+parts.momentum.value+' ＝ '+s.score+'（'+s.type+'）</summary><p>月令本气'+GAN[parts.month.monthMainGan]+'，'+({same:'比劫同类',resource:'印星生扶',output:'食伤泄气',officer:'官杀克身',wealth:'财星耗身'})[parts.month.relation]+'</p><p>'+esc0(roots)+'</p><p>'+esc0(momentum)+'</p><p>每个生扶藏干分别计位置加权；从弱阈值为算法分类，未单独证明真从格。</p></details>'+
    '<p>展示口径：'+stats.name+'。'+stats.description+'。核心扶抑分析仍用天干＋地支本气，切换展示不改四柱或旺衰。</p>'+wxBar(stats.counts)+
    '<table><thead><tr><th>统计口径</th><th>木火土金水个数</th><th>总次数</th></tr></thead><tbody>'+table+'</tbody></table><p>这些数字为计数，不代表物理能量或经校准的预测。</p>'+
    (zh.useGod?.conflict?'<p>规则分歧：当前取'+WUXING[zh.yongShen]+'；另一取用路径为'+zh.useGod.alternatives.map(w=>WUXING[w]).join('、')+'。'+esc0(zh.useGod.reason)+'</p>':'')+'</div>';
}
function unknownRangeText(ms){
  const d=civilFromMillis(ms);return fmtLocalDate(d)+' '+[d.getHours(),d.getMinutes(),d.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
}
function unknownSummary(result,name=''){
  return '姓名：'+(name||'未命名')+'\n'+result.precision+'\n规则：'+result.profile.name+' '+result.profile.version+'；'+dayBoundaryLabel(result.options.dayBoundary)+'\n'+
    result.stablePillars.map(p=>p.pillar+'柱'+(p.stable?'稳定：':'存在候选：')+p.values.join(' / ')).join('\n')+'\n'+
    result.candidates.map(c=>unknownRangeText(c.from)+' 至 '+unknownRangeText(c.to)+'（不含右端）：'+c.pillars.map(p=>GAN[p[0]]+ZHI[p[1]]).join(' ')).join('\n');
}
function renderUnknownCandidates(result,name){
  const stable=result.stablePillars.map(p=>'<li>'+p.pillar+'柱'+(p.stable?'稳定：':'随时段变化：')+p.values.join(' / ')+'</li>').join('');
  const rows=result.candidates.map((c,i)=>'<tr><td>'+(i+1)+'</td><td>'+unknownRangeText(c.from)+'<br>至 '+unknownRangeText(c.to)+'（不含右端）</td><td>'+c.pillars.map(p=>GAN[p[0]]+ZHI[p[1]]).join(' ')+'</td><td>'+c.lunar.year+'年'+lunarMonthName(c.lunar.month,c.lunar.isLeap)+lunarDayName(c.lunar.day)+'</td></tr>').join('');
  document.getElementById('zh-result').innerHTML='<div class="result" id="unknown-candidates"><h2>时辰未知 · 候选命盘</h2><p>'+esc0(name||'未命名')+'：'+esc0(result.precision)+'</p><p>性别未提供时，候选四柱不依赖性别；大运与其他性别相关推演暂不生成。</p><p>当前规则：'+esc0(result.profile.name)+' · '+esc0(dayBoundaryLabel(result.options.dayBoundary))+'</p><ul>'+stable+'</ul><p>以下按全部边界分段（含早/晚子时、交节与太阳时跨日），共 '+result.candidates.length+' 个候选区间。起运时分及依赖时柱的解读待核对。</p><div style="overflow-x:auto"><table><thead><tr><th>序号</th><th>原输入时区内的可能时间</th><th>年 月 日 时</th><th>对应农历</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    (result.excluded.length?'<p>有 '+result.excluded.length+' 段校正后超出历法范围，已明确排除。</p>':'')+
    '<button class="btn btn-ghost" onclick="copyUnknownSummary()">复制候选对比</button><p>如已知具体时分，请将“时辰准确性”改为“确定”后重新排盘。此模式不生成确定的AI解读、命局定档或PNG命盘图。</p></div>';
}
function copyUnknownSummary(){if(lastCandidates)copyText(unknownSummary(lastCandidates,lastName),'候选对比已复制');}
function saveUnknownRecord(result,name,gender,schoolId,genderUnspecified=false){
  migrateLegacyRecords();const recs=readStoredRecords(REC_KEY),dateStr=fmtLocalDate(result.inputDate);
  const old=recs.find(r=>r.unknowHour&&r.name===name&&r.dateStr===dateStr);
  const rec={id:old?old.id:Date.now()+''+Math.floor(Math.random()*1000),name,gender,dateStr,hourIdx:0,time:'',unknowHour:true,genderUnspecified,bazi:'时辰未知·'+result.candidates.length+'个候选区间',lunarText:'见候选对比',ts:Date.now(),place:result.place,
    trueSun:!!result.options.trueSolar,dayBoundary:result.options.dayBoundary,utcOffsetMinutes:result.options.utcOffsetMinutes??480,dstMinutes:result.options.dstMinutes||0,school2:schoolId,wxMode:result.options.wxMode||'stems-main-qi'};
  const all=[rec,...recs.filter(r=>r.id!==rec.id)].slice(0,50);localStorage.setItem(REC_KEY,JSON.stringify(all));renderRecords();
}
