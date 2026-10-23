/* Modules extracted in 5.18 */


// 农历年月日联动填充
function zhFillLunarSel(){
  try{
  const ySel=document.getElementById('zh-ly');
  if(!ySel.options.length){
    for(let y=2099;y>=1900;y--){
      const o=document.createElement('option');o.value=y;o.textContent=y+'年';ySel.appendChild(o);
    }
  }
  const now=beijingNow();
  const lunar=solar2lunar(now);
  ySel.value=lunar.year;
  zhRefreshLunarMonths();
  }catch(e){alert(e.message||String(e));}
}
function zhRefreshLunarMonths(){
  const y=parseInt(document.getElementById('zh-ly').value);
  const mSel=document.getElementById('zh-lm');
  const dSel=document.getElementById('zh-ld');
  const lSel=document.getElementById('zh-ll');
  const leap=leapMonth(y);
  // 月
  mSel.innerHTML='';
  const maxM=leap>0?12:12;
  for(let m=1;m<=12;m++){
    const o=document.createElement('option');o.value=m;o.textContent=lunarMonthName(m,false);mSel.appendChild(o);
  }
  // 闰月选项
  lSel.innerHTML='<option value="0">否</option>';
  if(leap>0){ const o=document.createElement('option');o.value=1;o.textContent='是(闰'+lunarMonthName(leap,false)+')';lSel.appendChild(o); }
  zhRefreshLunarDays();
}
function zhRefreshLunarDays(){
  const y=parseInt(document.getElementById('zh-ly').value);
  const m=parseInt(document.getElementById('zh-lm').value);
  const isLeap=parseInt(document.getElementById('zh-ll').value)===1;
  const dSel=document.getElementById('zh-ld');
  const previousDay=Number(dSel.value)||1;
  const leap=leapMonth(y);
  const days=isLeap?leapDays(y):monthDays(y,m);
  dSel.innerHTML='';
  for(let d=1;d<=days;d++){
    const o=document.createElement('option');o.value=d;o.textContent=d+'日';dSel.appendChild(o);
  }
  dSel.value=Math.min(previousDay,days);
}
// 综合排盘-历法切换
function zhToggleCal(){
  const cal=document.getElementById('zh-cal').value;
  const isLunar=cal==='1';
  document.getElementById('zh-solar-field').style.display=isLunar?'none':'';
  ['zh-lunar-field','zh-lm-field','zh-ld-field','zh-ll-field'].forEach(id=>{
    document.getElementById(id).style.display=isLunar?'':'none';
  });
  if(isLunar) zhFillLunarSel();
}
// 公历输入同步农历选择器
function zhSyncFromSolar(){
  const ds=document.getElementById('zh-solar').value;
  if(!ds) return;
  const [y,m,d]=ds.split('-').map(Number);
  let lunar;try{lunar=solar2lunar(parseCivilDate(ds));}catch(e){alert(e.message);return;}
  const ySel=document.getElementById('zh-ly');
  if(!ySel.options.length) zhFillLunarSel();
  ySel.value=lunar.year;
  zhRefreshLunarMonths();
  document.getElementById('zh-lm').value=lunar.month;
  document.getElementById('zh-ll').value=lunar.isLeap?1:0;
  zhRefreshLunarDays();
  document.getElementById('zh-ld').value=lunar.day;
}


function initHours(){
  document.querySelectorAll('#bz-hour,#zw-hour,#qm-hour,#ly-hour,#zh-hour,#hh1-hour,#hh2-hour').forEach(sel=>{
    if(!sel.options.length){
      HOUR_NAMES.forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=n;sel.appendChild(o);});
    }
  });
}

function bzNow(){
  const now=beijingNow();
  document.getElementById('bz-date').value=fmtLocalDate(now);
  const h=now.getHours();
  let zhi=h===23||h<1?0:Math.floor((h+1)/2)%12;
  document.getElementById('bz-hour').value=zhi;
  document.getElementById('bz-time').value=String(h).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  bzCast();
}
function bzCast(){
  try{
  const name=document.getElementById('bz-name').value.trim();
  const gender=parseInt(document.getElementById('bz-gender').value);
  const dateStr=document.getElementById('bz-date').value;
  const hourIdx=parseInt(document.getElementById('bz-hour').value);
  const school=parseInt(document.getElementById('bz-school').value);
  const school2Raw=parseInt(document.getElementById('bz-school2').value);
  const school2=(school2Raw>=0&&school2Raw<=4)?school2Raw:0;
  const options=readCalculationOptions('bz',school2);
  if(!dateStr){alert('请选择出生日期');return;}
  const time=document.getElementById('bz-time').value;
  const date=withBirthTime(parseCivilDate(dateStr),hourIdx,time);
  const temporal=calculateBirth(date,hourIdx,'',options);
  const actualDate=temporal.effectiveDate;
  const {yearGZ,monthGZ,dayGZ,hourGZ}=temporal;
  const lunar=solar2lunar(actualDate);
  const dayGan=dayGZ[0];
  // 藏干十神
  const yearHidden=ZHI_HIDDEN[yearGZ[1]];
  const monthHidden=ZHI_HIDDEN[monthGZ[1]];
  const dayHidden=ZHI_HIDDEN[dayGZ[1]];
  const hourHidden=ZHI_HIDDEN[hourGZ[1]];
  // 神煞
  const tianyiZhi=tianyiGan(dayGan);
  const wenchangZhi=wenchangGan(dayGan);
  const taoHua=taohuaZhi(yearGZ[1]);
  const yiMa=yimaZhi(yearGZ[1]);
  const huaGai=huagaiZhi(yearGZ[1]);
  const jiangXing=jiangxingZhi(yearGZ[1]);
  const kong=kongwang(dayGZ);
  // 大运
  const dy=getDaYun(temporal.civilDate,gender,yearGZ,school);
  const liuNian=getLiuNian(temporal.civilDate,8);
  // 胎元命宫身宫
  const taiYuan=getTaiYuan(monthGZ);
  const mingGongZhi=getMingGong(monthGZ,temporal.hourIdx);
  const shenGongZhi=getShenGong(monthGZ,temporal.hourIdx);
  // 五行统计
  let wxCount=[0,0,0,0,0];
  [yearGZ,monthGZ,dayGZ,hourGZ].forEach(gz=>{
    wxCount[GAN_WX[gz[0]]]++; wxCount[ZHI_WX[gz[1]]]++;
  });
  // 渲染
  const zhFull=zhCompute(date,hourIdx,gender,'',options);
  zhFull.time=time;zhFull.precisionNote=time?'时分已填写（分钟精度）':'仅知时辰：按时辰中点估算，交节与换日结果待核对';zhFull.solarNote=temporalDescription(zhFull);
  lastCandidates=null;lastZh=zhFull; lastName=name; lastSchool=school2;
  localStorage.setItem('mingli_school',school2);
  zhFull.dg=dayGan; // 兼容 renderBazi 内 zhiHiddenTs 等
  renderBazi({name,gender,date:actualDate,origDate:date,hourIdx:temporal.hourIdx,lunar,yearGZ,monthGZ,dayGZ,hourGZ,
    yearHidden,monthHidden,dayHidden,hourHidden,dayGan,tianyiZhi,wenchangZhi,taoHua,yiMa,huaGai,jiangXing,kong,dy,liuNian,taiYuan,mingGongZhi,shenGongZhi,wxCount,
    zh:zhFull,school:school2});
  // 保存八字排盘历史
  try{
    saveModRecord('bz',{name,gender,dateStr,hourIdx:hourIndexAt(date),school,school2,time,utcOffsetMinutes:options.utcOffsetMinutes,dstMinutes:options.dstMinutes,wxMode:options.wxMode,
      bazi:[yearGZ,monthGZ,dayGZ,hourGZ].map(g=>GAN[g[0]]+ZHI[g[1]]).join(' '),
      lunarText:lunar.year+'年'+(lunar.isLeap?'闰':'')+lunarMonthName(lunar.month,lunar.isLeap)+lunarDayName(lunar.day)});
  }catch(e){}
  }catch(e){alert(e.message||String(e));}
}
function wxTag(wx){ return `<span class="wu-xing tag ${WUXING_CLS[WUXING[wx]]}" style="background:rgba(255,255,255,.04)">${WUXING[wx]}</span>`; }
function gzShensha(gz,dayGZ,taoHua,yiMa,huaGai,jiangXing,kong,wenchangZhi,tianyiZhi){
  const z=gz[1];
  const clickable=(name)=>`<span class="tag" style="cursor:pointer;border-bottom:1px dashed var(--gold2)" onclick="showTerm('${name}')" title="点击查看详解">${name}</span>`;
  let tags=[];
  if(tianyiZhi.includes(z))tags.push(clickable('天乙贵人'));
  if(wenchangZhi.includes(z))tags.push(clickable('文昌贵人'));
  if(z===taoHua)tags.push(clickable('桃花'));
  if(z===yiMa)tags.push(clickable('驿马'));
  if(z===huaGai)tags.push(clickable('华盖'));
  if(z===jiangXing)tags.push(clickable('将星'));
  if(kong.includes(z))tags.push(clickable('空亡'));
  return tags.join('');
}
function renderBazi(d){
  const dg=d.dayGan;
  const cols=[
    {head:"年柱",gz:d.yearGZ,hidden:d.yearHidden,tenGod:tenGod(dg,d.yearGZ[0])},
    {head:"月柱",gz:d.monthGZ,hidden:d.monthHidden,tenGod:tenGod(dg,d.monthGZ[0])},
    {head:"日柱",gz:d.dayGZ,hidden:d.dayHidden,tenGod:-1},
    {head:"时柱",gz:d.hourGZ,hidden:d.hourHidden,tenGod:tenGod(dg,d.hourGZ[0])}
  ];
  let html=`<div class="result"><div class="result-title">八字命盘 </div>`;
  html+=`<div class="info-bar">`;
  if(d.zh) html+='<span>'+esc0(temporalDescription(d.zh))+'</span>';
  if(d.name)html+=`<span>姓名：<b>${esc0(d.name)}</b></span>`;
  html+=`<span>性别：<b>${genderLabel(d)}</b></span>`;
  html+=`<span>公历：<b>${d.date.getFullYear()}年${d.date.getMonth()+1}月${d.date.getDate()}日</b> ${HOUR_NAMES[d.hourIdx]}</span>`;
  html+=`<span>农历：<b>${d.lunar.year}年${d.lunar.isLeap?'闰':''}${lunarMonthName(d.lunar.month,d.lunar.isLeap)}${lunarDayName(d.lunar.day)}</b></span>`;
  const sx="鼠牛虎兔龙蛇马羊猴鸡狗猪"[d.yearGZ[1]];
  html+=`<span>生肖：<b>${sx}</b></span>`;
  html+=`<span>节气：<b>${curTermName(d.temporal?.civilDate||d.zh?.temporal?.civilDate||d.date)}</b></span>`;
  html+=`<span>星座：<b>${getZodiac(d.date)}</b></span>`;
  html+=`<span>命卦：<b>${getMingGua(d.date.getFullYear(),d.gender)}</b></span></div>`;
  if(d.zh) html+=renderRuleFacts(d.zh);
  // 问真式分段导航(命盘/大运流年/神煞简析)
  html+=`<div class="sec-nav" id="bz-sec-nav"><button type="button" class="sec-nav-btn active" data-sec="1" onclick="secGo('bz-sec-nav','bz-sec',1)">命盘</button><button type="button" class="sec-nav-btn" data-sec="2" onclick="secGo('bz-sec-nav','bz-sec',2)">大运流年</button><button type="button" class="sec-nav-btn" data-sec="3" onclick="secGo('bz-sec-nav','bz-sec',3)">神煞简析</button></div>`;
  html+=`<div class="sec-page" id="bz-sec-1">`;
  // 四柱命盘(带五行颜色,与综合排盘一致)
  const zh=d.zh;
  const slRef=typeof siLingInfo==='function'?(zh||d)?siLingInfo((zh||d).date,(zh||d).monthGZ[1]):null:null; // 优化: 提到循环外只算一次
  html+=`<div class="section-block"><h3>四柱命盘 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（五行着色 · 藏干十神 · 长生 · 纳音 · 司令）</span></h3><div class="pillar-grid">`;
  cols.forEach((c,i)=>{
    const gz=c.gz;
    const isSelf=i===2;
    const ts=isSelf?'日主':SHISHEN_NAME[tenGod(d.dayGan,gz[0])];
    const hd=zhiHiddenTs(zh||d,gz[1]);
    const cs=getChangSheng(d.dayGan,gz[1]);
    const csCls=['长生','临官','帝旺'].includes(cs)?'color:var(--red)':'';
    const gCls=WUXING_CLS[WUXING[GAN_WX[gz[0]]]], zCls=WUXING_CLS[WUXING[ZHI_WX[gz[1]]]];
    const hdHtml=hd.map(x=>`${GAN[x.g]}<span style="color:var(--ink3)">${tterm(x.ts)}${x.r}%</span>`).join(' · ');
    const lingHtml=i===1&&slRef?`<br>司令 <b style="color:var(--gold)">${GAN[slRef.cur]}</b><span style="color:var(--ink3)">（节后${slRef.pass}日）</span>`:'';
    let ssHtml='';
    try{
      const gzSS=typeof gzShensha==='function'?gzShensha(gz,d.dayGZ,d.taoHua,d.yiMa,d.huaGai,d.jiangXing,d.kong,d.wenchangZhi,d.tianyiZhi):'';
      if(gzSS) ssHtml='<br>神煞 '+gzSS;
    }catch(e){}
    html+=`<div class="pillar-card${isSelf?' self':''}"><div class="p-tag">${['年柱','月柱','日柱','时柱'][i]}</div><div class="p-gz"><span style="color:var(--c-${gCls})">${GAN[gz[0]]}</span><span class="z" style="color:var(--c-${zCls})">${ZHI[gz[1]]}</span></div><div class="p-ts">${tterm(ts)}</div><div class="p-detail">藏干 ${hdHtml}${lingHtml}${ssHtml}<br>长生 <span style="${csCls}">${tterm(cs)}</span></div><div class="p-wx"><span style="color:var(--c-${gCls})">${WUXING[GAN_WX[gz[0]]]}</span>·<span style="color:var(--c-${zCls})">${WUXING[ZHI_WX[gz[1]]]}</span> <i>${NAYIN[nayinIndex(gz[0],gz[1])]}</i></div></div>`;
  });
  html+=`</div></div>`;
  // 五行能量条
  html+=`<div class="section-block"><h3>五行计数（天干＋地支本气） <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（个数与占比）</span></h3><div style="background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:14px 16px">${wxBar(d.wxCount)}</div></div>`;
  // 六神配置(用神/喜神/忌神/仇神/闲神)
  if(zh){
    const ls=zhLiuShen(zh);
    const lsRows=[
      {role:'用神',w:ls.yong,desc:ls.roles.yong,color:'var(--gold)',bg:'rgba(176,138,62,.1)'},
      {role:'喜神',w:ls.xi,desc:ls.roles.xi,color:'var(--gold)',bg:'rgba(176,138,62,.07)'},
      {role:'忌神',w:ls.ji,desc:ls.roles.ji,color:'var(--red)',bg:'rgba(158,43,37,.07)'},
      {role:'仇神',w:ls.chou,desc:ls.roles.chou,color:'var(--red2)',bg:'rgba(122,32,28,.07)'}
    ];
    html+=`<div class="section-block"><h3>⚔️ 喜用神阵营 · 喜用忌仇闲 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（敌我阵营学：主帅·援军·敌军·粮草·路人 · ${zh.strengthType} · 当前流派：<b style="color:var(--jade)">${SCHOOLS[zh.school??d.school??0]}</b>）</span></h3>`;
    html+=`<div style="background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:14px 16px">`;
    lsRows.forEach(r=>{
      html+=`<div style="display:flex;align-items:center;gap:10px;margin:5px 0;padding:6px 10px;background:${r.bg};border-radius:8px;border-left:3px solid ${r.color}"><span style="width:36px;font-size:.8rem;font-weight:700;color:${r.color}">${tterm(r.role)}</span><span style="font-size:.9rem;font-weight:700;color:${r.color}">${WUXING[r.w]||'—'}</span><span style="font-size:.72rem;color:var(--ink3)">${ls.count(r.w)||0}位</span><span style="font-size:.72rem;color:var(--ink2);flex:1">${r.desc}</span></div>`;
    });
    html+=`<div style="display:flex;align-items:center;gap:10px;margin:5px 0;padding:6px 10px;background:rgba(107,100,87,.06);border-radius:8px;border-left:3px solid var(--ink2)"><span style="width:36px;font-size:.8rem;font-weight:700;color:var(--ink2)">${tterm('闲神')}</span><span style="font-size:.9rem;font-weight:700;color:var(--ink2)">${ls.xian.map(w=>WUXING[w]).join('、')||'—'}</span><span style="font-size:.72rem;color:var(--ink3)">${ls.xian.map(w=>ls.count(w)+'位').join(' ')}</span><span style="font-size:.72rem;color:var(--ink2);flex:1">${ls.roles.xian} · 大运流年来才见真章</span></div>`;
    html+=`</div></div>`;
  }
  html+=`</div>`;
  html+=`<div class="sec-page" id="bz-sec-2" style="display:none">`;
  // 专业细盘(大运+流年+流月+流日)
  html+=`<div class="section-block"><details><summary style="cursor:pointer;color:var(--gold);font-size:.95rem;font-weight:600"> 专业细盘 · 大运流年流月流日 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（点击展开 · 大运/流年含长生与藏干十神）</span></summary><div style="overflow-x:auto">`;
  html+=`<div style="margin-top:8px"><b style="color:var(--ink2);font-size:.82rem">大运（${d.dy.startYears}岁${d.dy.startMonths?('零'+d.dy.startMonths+'个月'):''}起运，${d.dy.forward?'顺行':'逆行'}，出生距交节${d.dy.days}天）</b></div>`;
  const dyCsCls=cs=>['长生','临官','帝旺'].includes(cs)?'color:var(--red)':'color:var(--ink3)';
  html+=`<table class="dy-table"><thead><tr><th>序</th><th>大运</th><th>纳音</th><th>天干十神</th><th>藏干十神</th><th>长生</th><th>起止</th></tr></thead><tbody>`;
  const nowYear=new Date().getFullYear();
  const birthYear=d.date.getFullYear();
  d.dy.dyList.forEach((dy,i)=>{
    const tg=tenGod(dg,dy.g);
    const cs=getChangSheng(dg,dy.z);
    const hd=zhiHiddenTs(d,dy.z).map(x=>`${GAN[x.g]}<i style="font-style:normal;color:var(--ink3)">${tterm(x.ts)}</i>`).join('·');
    const active=(birthYear+dy.age<=nowYear && nowYear<=birthYear+dy.endAge);
    html+=`<tr${active?' class="age-active"':''}><td>${i+1}</td><td class="gz" style="font-size:1.05rem">${GAN[dy.g]}${ZHI[dy.z]}</td><td class="nayin">${dy.nayin}</td><td>${tsSpan(SHISHEN_NAME[tg],SHISHEN_NAME[tg])}</td><td style="font-size:.66rem;line-height:1.6">${hd}</td><td style="font-size:.7rem;${dyCsCls(cs)}">${tterm(cs)}</td><td>${dy.age}-${dy.endAge}岁</td></tr>`;
  });
  html+=`</tbody></table>`;
  // 流年
  html+=`<div style="margin-top:10px"><b style="color:var(--ink2);font-size:.82rem">近年流年</b></div>`;
  html+=`<table class="dy-table"><thead><tr><th>年份</th><th>干支</th><th>纳音</th><th>十神</th><th>藏干</th><th>长生</th></tr></thead><tbody>`;
  d.liuNian.forEach(l=>{
    const tg=tenGod(dg,l.g);
    const cs=getChangSheng(dg,l.z);
    const hd=zhiHiddenTs(d,l.z).map(x=>`${GAN[x.g]}<i style="font-style:normal;color:var(--ink3)">${tterm(x.ts)}</i>`).join('·');
    const isNow=l.year===nowYear;
    html+=`<tr${isNow?' class="age-active"':''}><td>${l.year}</td><td class="gz" style="font-size:1.05rem">${GAN[l.g]}${ZHI[l.z]}</td><td class="nayin">${l.nayin}</td><td>${tsSpan(SHISHEN_NAME[tg],SHISHEN_NAME[tg])}</td><td style="font-size:.66rem;line-height:1.6">${hd}</td><td style="font-size:.7rem;${dyCsCls(cs)}">${tterm(cs)}</td></tr>`;
  });
  html+=`</tbody></table>`;
  // 流月
  const nowGZ=getYearGZ(new Date());
  const liuYue=getLiuYue(nowGZ[0],12);
  html+=`<div style="margin-top:10px"><b style="color:var(--ink2);font-size:.82rem">${nowYear}年流月</b></div>`;
  html+=`<table class="dy-table"><thead><tr><th>月份</th><th>干支</th><th>纳音</th><th>十神</th></tr></thead><tbody>`;
  liuYue.forEach((m,i)=>{
    const tg=tenGod(dg,m.g);
    html+=`<tr><td>${lunarMonthName(i+1,false)}</td><td class="gz" style="font-size:1rem">${GAN[m.g]}${ZHI[m.z]}</td><td class="nayin">${m.nayin}</td><td>${SHISHEN_NAME[tg]}</td></tr>`;
  });
  html+=`</tbody></table>`;
  // 流日
  const liuRi=getLiuRi(new Date(),15);
  html+=`<div style="margin-top:10px"><b style="color:var(--ink2);font-size:.82rem">未来半月流日</b></div>`;
  html+=`<table class="dy-table"><thead><tr><th>日期</th><th>干支</th><th>十神</th></tr></thead><tbody>`;
  liuRi.forEach(r=>{
    const tg=tenGod(dg,r.g);
    const isToday=r.date.getFullYear()===nowYear&&r.date.getMonth()===new Date().getMonth()&&r.date.getDate()===new Date().getDate();
    html+=`<tr${isToday?' class="age-active"':''}><td>${r.date.getMonth()+1}月${r.date.getDate()}日</td><td class="gz" style="font-size:1rem">${GAN[r.g]}${ZHI[r.z]}</td><td>${SHISHEN_NAME[tg]}</td></tr>`;
  });
  html+=`</tbody></table>`;
  // 流时(未来2日逐时辰)
  const liuShi=getLiuShi(new Date(),2,dg);
  html+=`<div style="margin-top:10px"><b style="color:var(--ink2);font-size:.82rem">未来两日流时</b></div>`;
  html+=`<table class="dy-table"><thead><tr><th>日期</th><th>时辰</th><th>干支</th><th>十神</th></tr></thead><tbody>`;
  liuShi.forEach(r=>{
    const isNow=r.date.getFullYear()===nowYear&&r.date.getMonth()===new Date().getMonth()&&r.date.getDate()===new Date().getDate()&&Math.floor(new Date().getHours()/2)===r.hourIdx;
    html+=`<tr${isNow?' class="age-active"':''}><td>${r.date.getMonth()+1}月${r.date.getDate()}日</td><td>${HOUR_NAMES[r.hourIdx]}</td><td class="gz" style="font-size:.95rem">${GAN[r.g]}${ZHI[r.z]}</td><td>${SHISHEN_NAME[r.tg]}</td></tr>`;
  });
  html+=`</tbody></table></div></details></div>`;
  html+=`</div>`;
  html+=`<div class="sec-page" id="bz-sec-3" style="display:none">`;
  // 胎元命宫身宫
  html+=`<div class="section-block"><h3>胎元·命宫·身宫</h3><div class="desc-grid">`;
  html+=`<div class="desc-item"><div class="k">胎元</div><div class="v">${GAN[d.taiYuan[0]]}${ZHI[d.taiYuan[1]]}</div></div>`;
  html+=`<div class="desc-item"><div class="k">命宫</div><div class="v">${ZHI[d.mingGongZhi]}</div></div>`;
  html+=`<div class="desc-item"><div class="k">身宫</div><div class="v">${ZHI[d.shenGongZhi]}</div></div>`;
  html+=`</div></div>`;
  // 神煞总览
  html+=`<div class="section-block"><h3>主要神煞</h3><div class="desc-grid">`;
  const hasSS=(z,arr)=>arr.includes(z);
  const allZhi=[d.yearGZ[1],d.monthGZ[1],d.dayGZ[1],d.hourGZ[1]];
  const ssItems=[
    {k:"天乙贵人",v:d.tianyiZhi.map(z=>ZHI[z]).join('、'),desc:"日干所查"},
    {k:"文昌贵人",v:d.wenchangZhi.map(z=>ZHI[z]).join('、'),desc:"日干所查"},
    {k:"桃花",v:ZHI[d.taoHua],desc:"年支所查"},
    {k:"驿马",v:ZHI[d.yiMa],desc:"年支所查"},
    {k:"华盖",v:ZHI[d.huaGai],desc:"年支所查"},
    {k:"将星",v:ZHI[d.jiangXing],desc:"年支所查"},
    {k:"空亡",v:d.kong.map(z=>ZHI[z]).join('、'),desc:"日柱旬空"}
  ];
  ssItems.forEach(s=>{
    html+=`<div class="desc-item"><div class="k">${tterm(s.k)} <span style="color:var(--ink3)">(${s.desc})</span></div><div class="v">${s.v}</div></div>`;
  });
  html+=`</div></div>`;
  // 简析
  const maxWx=WUXING[d.wxCount.indexOf(Math.max(...d.wxCount))];
  const minWx=WUXING[d.wxCount.indexOf(Math.min(...d.wxCount))];
  if(typeof jieqiNearNote==='function'){
    const nearJQ=jieqiNearNote(d.zh?.temporal?.civilDate||d.date||zh.date);
    if(nearJQ.length) html+=`<div style="background:rgba(200,122,45,.08);border:1px solid #c87a2d;border-radius:8px;padding:8px 12px;font-size:.74rem;color:var(--ink2);line-height:1.7;margin-bottom:10px">⚠️ 出生时间临近【${nearJQ.map(j=>j.name+'（'+j.diff+'天后）').join('、')}】节气交接，月柱/年柱可能受影响，请核对出生时间</div>`;
  }
  html+=`<div class="note">命局简析：日主${GAN[dg]}${WUXING[GAN_WX[dg]]}，生于${d.monthGZ?ZHI[d.monthGZ[1]]:''}月。`;
  const dy0=d.dy.dyList[0];
  if(dy0)html+=`${d.dy.startAge}岁起运，大运${GAN[dy0.g]}${ZHI[dy0.z]}，主少年时期${SHISHEN_NAME[tenGod(dg,dy0.g)]}运。`;
  html+=`五行${maxWx}旺${minWx}弱，宜补${minWx}泄${maxWx}。此盘仅供参考，命理预测需结合大运流年综合判断。</div>`;
  html+=`</div>`;
  html+=`</div>`;
  document.getElementById('bz-result').innerHTML=html;
}

/* ======================== 紫微斗数 ======================== */
// 十四主星数据

// 命宫天干(五虎遁定寅首): 甲己丙寅、乙庚戊寅、丙辛庚寅、丁壬壬寅、戊癸甲寅

// 生年天干四化(禄权科忌): 甲廉破武阳、乙机梁紫阴、丙同机昌廉、丁阴同机巨、戊贪阴弼机、己武贪梁曲、庚阳武阴同、辛巨阳曲昌、壬梁紫左武、癸破巨阴贪

// 标准五行局: 以命宫干支纳音定局(安星诀: 金四木三水二火六土五)

// 大限: 命宫起,阳男阴女顺行、阴男阳女逆行,每宫十年; 起运岁数=局数

// 紫微星定位(紫微星诀精确算法,对齐文墨天机/iztro): 
// 生日逐日+1至能被局数整除,商为步数(余数宫后走/顺逆交替)
// 验证: 金四局27日→未; 土五局初一→午; 水二局初一→丑

function zwNow(){const n=beijingNow();document.getElementById('zw-date').value=fmtLocalDate(n);const h=n.getHours();document.getElementById('zw-hour').value=h===23||h<1?0:Math.floor((h+1)/2)%12;zwCast();}
function zwCast(){
  try{
  const dateStr=document.getElementById('zw-date').value;
  const hourIdx=parseInt(document.getElementById('zw-hour').value);
  const gender=parseInt(document.getElementById('zw-gender').value);
  if(!dateStr){alert('请选择日期');return;}
  const [y,m,d]=dateStr.split('-').map(Number);
  const date=parseCivilDate(dateStr);
  const result=calculateZiwei({date,hourIdx,gender});
  const {lunar,mgGan,mingGong,ju}=result;renderZW(result);
  // 保存紫微排盘历史
  try{
    const zwStyle=parseInt(document.getElementById('zw-style').value);
    saveModRecord('zw',{gender,dateStr,hourIdx,style:(zwStyle>=0&&zwStyle<=1)?zwStyle:0,
      title:'命宫'+GAN[mgGan]+ZHI[mingGong]+'·'+['水二','木三','金四','土五','火六'][ju-2]+'局',
      lunarText:lunar.year+'年'+(lunar.isLeap?'闰':'')+lunarMonthName(lunar.month,lunar.isLeap)+lunarDayName(lunar.day)});
  }catch(e){}
  }catch(e){alert(e.message||String(e));}
}

// 辅星标准安法: 左辅从辰宫起顺数生月,右弼从戌宫起逆数生月,文曲从辰宫起顺数生时,文昌从戌宫起逆数生时
// 天魁天钺按年干: 甲戊庚牛羊(丑未)、乙己鼠猴乡(子申)、丙丁猪鸡位(亥酉)、壬癸兔蛇藏(卯巳)、六辛逢虎马(寅午)

// ====== 三合派完整小曜安星(依据《紫微斗数全书》) ======
// 禄存(年干): 甲寅乙卯丙戊巳丁己午庚申辛酉壬亥癸子

// 擎羊陀罗(随禄存): 禄前擎羊、禄后陀罗

// 天马(年支): 寅午戌马在申、申子辰马在寅、巳酉丑马在亥、亥卯未马在巳

// 火星铃星(年支+生时): 寅午戌丑卯方、申子辰寅戌场、巳酉丑卯戌位、亥卯未酉戌房(从起宫顺数至生时)

// 天空地劫(生时): 亥上起子顺安劫(地劫)、逆回便是天空乡(天空)

// 截空(年干): 甲己申酉、乙庚午未、丙辛辰巳、丁壬寅卯、戊癸子丑(正副双星)

// 旬空(年干支定旬): 甲子旬戌亥、甲戌旬申酉、甲申旬午未、甲午旬辰巳、甲辰旬寅卯、甲寅旬子丑(正副双星)

// 天使天伤: 天伤永在交友宫、天使永在疾厄宫(命宫逆排)

// 命主(命宫地支): 子贪狼丑亥巨门寅戌禄存卯酉文曲辰申廉贞巳未武曲午破军

// 身主(年支): 子午火铃丑未天相寅申天梁卯酉天同辰戌文昌巳亥天机

// 红鸾天喜(年支): 卯上起子逆数至生年支安红鸾,对宫天喜

// 孤辰寡宿(年支): 寅卯辰安巳丑、巳午未安申辰、申酉戌安亥未、亥子丑安寅戌

// 龙池凤阁(年支): 龙池辰起子顺至生年支、凤阁戌起子逆至生年支

// 天哭天虚(年支): 午起子两分踪,哭逆虚顺

// 华盖(年支): 子辰申在辰、丑巳酉在丑、寅午戌在戌、卯未亥在未

// 咸池(年支): 子辰申在酉、丑巳酉在午、寅午戌在卯、卯未亥在子

// 破碎(年支): 子午卯酉在巳、寅申巳亥在酉、辰戌丑未在丑

// 蜚廉(年支): 子丑寅在申酉戌、卯辰巳在巳午未、午未申在寅卯辰、酉戌亥在亥子丑

// 天刑天姚(生月): 天刑酉起正月顺、天姚丑起正月顺

// 三台八座(生日+左辅右弼): 三台从左辅起初一顺数至生日、八座从右弼起初一逆数至生日

// 台辅封诰(生时): 台辅午起子顺、封诰寅起子顺

// 天官天福(年干): 甲喜羊鸡乙龙猴丙蛇鼠丁虎猪戊玉兔己鸡虎庚猪马辛鸡蛇壬犬马癸马蛇

// 恩光天贵(生日+昌曲): 恩光从文昌起初一顺数至生日退一步、天贵从文曲起初一顺数至生日退一步

// 天厨(年干): 甲丁蛇口巳乙戊辛马午丙鼠子己猴申庚虎寅壬鸡酉癸猪亥

// 岁前十二神(年支起顺行): 岁建晦气丧门贯索官符小耗大耗龙德白虎天德吊客病符

// 将前十二神(将星起顺行): 将星攀鞍岁驿息神华盖劫煞灾煞天煞指背咸池月煞亡神
// 将星=三合旺位: 寅午戌午、申子辰子、巳酉丑酉、亥卯未卯

// 博士十二神(命宫起,顺逆同大限): 博士力士青龙小耗将军奏书飞廉喜神病符大耗伏兵官府
// 注: 与岁前/将前同名者加后缀2避免字段冲突(小耗/大耗/病符/喜神/飞廉)

// 长生十二神(按五行局,阳男阴女顺行、阴男阳女逆行): 水二申木三亥金四巳土五申火六寅

// 星曜亮度(庙旺利陷,依据《紫微斗数全书》): key:星名 -> 12宫亮度数组


function renderZW(d){
  // 十二宫以命宫为起点逆排
  const palaceOrder=["命宫","兄弟","夫妻","子女","财帛","疾厄","迁移","交友","官禄","田宅","福德","父母"];
  const gongPos=[]; // gongPos[i] = 第i宫在哪个地支(0子-11亥)
  for(let i=0;i<12;i++){ gongPos[i]=((d.mingGong-i)%12+12)%12; }
  // 4x4 布局: 标准紫微盘
  // 位置顺序(4x4去掉中间4格): 12格
  // 布局: [命财疾][兄迁][夫奴][子官][田福][父母]
  const layout=[0,5,6, 4,11, 3,10, 2,9, 1,8,7]; // 12宫的显示顺序
  // 标准12宫位置: 命宫在固定地支,12格环绕
  let html=`<div class="result"><div class="result-title">紫微命盘 </div>`;
  html+=`<div class="info-bar">`;
  // 农历显示防御: 农历表边界(1900年前后)可能返回异常值,回退公历
  const lOk=d.lunar&&d.lunar.day>0&&d.lunar.month>=1&&d.lunar.month<=12&&d.lunar.year>1900;
  const lTxt=lOk
    ?`${d.lunar.year}年${d.lunar.isLeap?'闰':''}${lunarMonthName(d.lunar.month,d.lunar.isLeap)}${lunarDayName(d.lunar.day)}`
    :`（农历表边界，按公历参考）`;
  html+=`<span>农历：<b>${lTxt}</b></span>`;
  html+=`<span>五行局：<b>${['水二','木三','金四','土五','火六'][d.ju-2]}局</b></span>`;
  html+=`<span>命宫：<b>${GAN[d.mgGan]}${ZHI[d.mingGong]}</b></span>`;
  html+=`<span>身宫：<b>${ZHI[d.shenGong]}</b></span>`;
  // 四化
  const huaName=['禄','权','科','忌'];
  html+=`<span>生年四化：<b>${d.siHua.map((s,i)=>s+huaName[i]).join(' ')}</b></span>`;
  html+=`<span>流年四化：<b>${d.liuNianSiHua.map((s,i)=>s+huaName[i]).join(' ')}</b></span>`;
  html+=`<span>命主：<b>${d.mingZhuStar}</b></span>`;
  html+=`<span>身主：<b>${d.shenZhuStar}</b></span>`;
  html+=`<span>大限：<b>${d.daLim.forward?'顺行':'逆行'}（${d.ju}岁起运）</b></span>`;
  html+=`<span>长生：<b>${d.cs12.forward?'顺行':'逆行'}</b></span></div>`;
  // 宫位映射: 地支->宫名
  const zhiToGong={};
  palaceOrder.forEach((g,i)=>{ zhiToGong[gongPos[i]]=g; });
  // 星名→key 映射(供四化定位)
  const STAR_NAME_KEY={};
  Object.keys(ZW_STARS).forEach(k=>{ STAR_NAME_KEY[ZW_STARS[k].name]=k; });
  Object.keys(d.minorStars).forEach(k=>{
    const nm={zuoqu:'左辅',youbi:'右弼',wenchang:'文昌',wenqu:'文曲',tiankui:'天魁',tianyue:'天钺'}[k]||k;
    if(!STAR_NAME_KEY[nm]) STAR_NAME_KEY[nm]=k;
  });
  // 四化标记: 星名→(禄权科忌位置); 生年四化红色、流年四化青色
  const huaMark={},huaMark2={};
  d.siHua.forEach((s,i)=>{ if(STAR_NAME_KEY[s]) huaMark[STAR_NAME_KEY[s]]=huaName[i]; });
  d.liuNianSiHua.forEach((s,i)=>{ if(STAR_NAME_KEY[s]) huaMark2[STAR_NAME_KEY[s]]=huaName[i]; });
  // 大限: 地支→起止岁
  const daLimByZhi={};
  d.daLim.list.forEach(x=>{ daLimByZhi[x.zhi]=x.start+'-'+x.end; });
  // 4x4网格,12宫排布(标准: 命宫起逆布, 地支固定位置, 左上角为巳)
  html+=`<div class="zw-grid">`;
  // 12个格子,按4列布局
  // 行1: 巳(6) 午(7) 未(8) 申(9) -- 但要对应命宫起逆
  // 用地支固定位置: 子(0)在下方中央,逆时针
  // 简化: 按地支顺序0-11排4列
  for(let row=0;row<4;row++){
    for(let col=0;col<4;col++){
      const zhiIdx=row*4+col;
      // 跳过中间(1,1)(1,2)(2,1)(2,2)
      if((row===1||row===2)&&(col===1||col===2)){
        if(row===1&&col===1) html+=`<div class="zw-cell center"><div style="text-align:center;color:var(--gold);font-size:.8rem;padding:8px 4px">紫微斗数<br><span style="font-size:.66rem;color:var(--ink3)">${d.lunar.year}年</span></div></div>`;
        else if(row===1&&col===2) html+=`<div class="zw-cell center"><div style="text-align:center;color:var(--ink3);font-size:.72rem;padding:20px 4px">${['水二','木三','金四','土五','火六'][d.ju-2]}局</div></div>`;
        else if(row===2&&col===1) html+=`<div class="zw-cell center"><div style="text-align:center;color:var(--gold);font-size:.72rem;padding:20px 4px">命宫·${ZHI[d.mingGong]}</div></div>`;
        else html+=`<div class="zw-cell center"><div style="text-align:center;color:var(--ink3);font-size:.72rem;padding:20px 4px">身宫·${ZHI[d.shenGong]}</div></div>`;
        continue;
      }
      // 地支位置: 标准紫微盘 4x4(去中间4格), 从左上起顺时针12宫
      // 标准盘: 巳午未申 / 辰·酉 / 卯·戌 / 寅丑子亥 (命宫巳在左上角)
      // 16格(row*4+col)对应的地支索引: 中间4格(5,6,9,10)被continue跳过
      const posMap=[5,6,7,8, 4,-1,-1,9, 3,-1,-1,10, 2,1,0,11];
      const zi=posMap[zhiIdx];
      const gongName=zhiToGong[zi]||"";
      const isBody=(zi===d.shenGong);
      const isMing=(zi===d.mingGong);
      // 收集该宫全部星曜: {name, cls, mark(四化), bright(亮度)}
      const cellStars=[];
      // 主星(十四主星)
      Object.keys(d.stars).forEach(k=>{
        if(d.stars[k]===zi){
          const star=ZW_STARS[k];
          const m1=huaMark[k]?`<sup style="color:var(--red);font-size:.56rem">${huaMark[k]}</sup>`:'';
          const m2=huaMark2[k]?`<sup style="color:var(--blue);font-size:.56rem">${huaMark2[k]}</sup>`:'';
          const bright=ZW_BRIGHT[star.name]?ZW_BRIGHT[star.name][zi]:'';
          cellStars.push({name:star.name,cls:'main',mark:m1+m2,bright});
        }
      });
      // 辅星(左右昌曲魁钺) + 禄存
      const minorNm={zuoqu:'左辅',youbi:'右弼',wenchang:'文昌',wenqu:'文曲',tiankui:'天魁',tianyue:'天钺'};
      Object.keys(d.minorStars).forEach(k=>{
        if(d.minorStars[k]===zi){
          const nm=minorNm[k]||k;
          const m1=huaMark[k]?`<sup style="color:var(--red);font-size:.56rem">${huaMark[k]}</sup>`:'';
          const m2=huaMark2[k]?`<sup style="color:var(--blue);font-size:.56rem">${huaMark2[k]}</sup>`:'';
          const bright=ZW_BRIGHT[nm]?ZW_BRIGHT[nm][zi]:'';
          cellStars.push({name:nm,cls:'minor',mark:m1+m2,bright});
        }
      });
      if(d.luCun===zi){ cellStars.push({name:'禄存',cls:'minor',mark:'',bright:ZW_BRIGHT['禄存']?ZW_BRIGHT['禄存'][zi]:''}); }
      // 煞星
      const shaMap={qingYang:'擎羊',tuoLuo:'陀罗',huoXing:'火星',lingXing:'铃星',tianKong:'天空',diJie:'地劫'};
      Object.keys(shaMap).forEach(k=>{
        if(d[k]===zi){ cellStars.push({name:shaMap[k],cls:'sha',mark:'',bright:ZW_BRIGHT[shaMap[k]]?ZW_BRIGHT[shaMap[k]][zi]:''}); }
      });
      // 杂曜(小星) — 含岁前/将前/博士十二神
      const zaMap={
        tianMa:'天马',jieKong:'截空',jieKong2:'副截空',xunKong:'旬空',xunKong2:'副旬空',
        tianShi:'天使',tianShang:'天伤',hongLuan:'红鸾',tianXi:'天喜',
        guChen:'孤辰',guaSu:'寡宿',longChi:'龙池',fengGe:'凤阁',
        tianKu:'天哭',tianXu:'天虚',hg:'华盖',xc:'咸池',
        ps:'破碎',fl:'蜚廉',tianXing:'天刑',tianYao:'天姚',
        sanTai:'三台',baZuo:'八座',taiFu:'台辅',fengGao:'封诰',
        tianGuan:'天官',tianFu:'天福',enGuang:'恩光',tianGui:'天贵',tc:'天厨',
        suiJian:'岁建',huiQi:'晦气',sangMen:'丧门',guanSuo:'贯索',guanFu:'官符',
        xiaoHao:'小耗',daHao:'大耗',longDe:'龙德',baiHu:'白虎',tianDe:'天德',diaoKe:'吊客',bingFu:'病符',
        jiangXing:'将星',panAn:'攀鞍',suiYi:'岁驿',xiShen:'息神',
        jieSha:'劫煞',zaiSha:'灾煞',tianSha:'天煞',zhiBei:'指背',yueSha:'月煞',wangShen:'亡神',
        boShi:'博士',liShi:'力士',qingLong:'青龙',jiangJun:'将军',zouShu:'奏书',xiShen2:'喜神',
        fuBing:'伏兵',guanFu2:'官府',xiaoHao2:'小耗',daHao2:'大耗',bingFu2:'病符',feiLian2:'飞廉'
      };
      Object.keys(zaMap).forEach(k=>{
        if(d[k]===zi){ cellStars.push({name:zaMap[k],cls:'za',mark:'',bright:''}); }
      });
      // 命主身主标注
      if(d.mingZhuStar){
        const mzPos=d.stars[STAR_NAME_KEY[d.mingZhuStar]];
        if(mzPos===zi){ cellStars.push({name:'命主·'+d.mingZhuStar,cls:'za',mark:'',bright:''}); }
      }
      if(d.shenZhuStar){
        // 身主星: 若是主星/辅星之一则找其位置, 否则按名称映射
        const spKey=STAR_NAME_KEY[d.shenZhuStar];
        const spPos=spKey?(d.stars[spKey]!==undefined?d.stars[spKey]:(d.minorStars[spKey]!==undefined?d.minorStars[spKey]:-1)):-1;
        if(spPos===zi){ cellStars.push({name:'身主·'+d.shenZhuStar,cls:'za',mark:'',bright:''}); }
      }
      // 长生十二神
      const csItem=d.cs12.list.find(x=>x.zhi===zi);
      // 大限
      const dl=daLimByZhi[zi];
      let starHtml='';
      cellStars.forEach(s=>{
        const brightHtml=s.bright?`<span class="bright ${s.bright}">${s.bright}</span>`:'';
        starHtml+=`<span class="star ${s.cls}">${s.name}${brightHtml}${s.mark}</span>`;
      });
      if(csItem) starHtml+=`<span class="cs12">${csItem.name}</span>`;
      html+=`<div class="zw-cell ${isMing?'is-ming':''}"><div class="palace-name">${gongName}${isBody?'<span class="body">(身)</span>':''}${isMing?'<span class="body">(命)</span>':''}</div><div class="stem-branch">${GAN[d.gongGan[zi]]}${ZHI[zi]}${dl?`<span class="da-lim">${dl}岁</span>`:''}</div><div class="stars">${starHtml}</div></div>`;
    }
  }
  html+=`</div>`;
  // 星曜说明
  html+=`<div class="section-block"><h3>十四主星分布</h3><div class="desc-grid">`;
  Object.keys(ZW_STARS).forEach(k=>{
    const pos=d.stars[k];
    const gong=zhiToGong[pos]||"";
    const mark=huaMark[k]?`<span style="color:var(--red)">·${huaMark[k]}</span>`:'';
    const bright=ZW_BRIGHT[ZW_STARS[k].name]?ZW_BRIGHT[ZW_STARS[k].name][pos]:'';
    html+=`<div class="desc-item"><div class="k">${ZW_STARS[k].name}${bright?'<span style="color:var(--gold2);font-size:.7rem">('+bright+')</span>':''}${mark}</div><div class="v">${ZHI[pos]}·${gong}</div></div>`;
  });
  html+=`</div></div>`;
  // 长生十二神
  html+=`<div class="section-block"><h3>长生十二神（${d.cs12.forward?'顺行':'逆行'}）</h3><div class="desc-grid">`;
  d.cs12.list.forEach((x,i)=>{
    const gong=zhiToGong[x.zhi]||"";
    html+=`<div class="desc-item"><div class="k">${x.name}</div><div class="v">${ZHI[x.zhi]}·${gong}</div></div>`;
  });
  html+=`</div></div>`;
  // 星曜总览
  html+=`<div class="section-block"><h3>星曜总览</h3><div class="desc-grid">`;
  const allStars=[
    ['禄存',ZHI[d.luCun]],['擎羊',ZHI[d.qingYang]],['陀罗',ZHI[d.tuoLuo]],['天马',ZHI[d.tianMa]],
    ['火星',ZHI[d.huoXing]],['铃星',ZHI[d.lingXing]],['天空',ZHI[d.tianKong]],['地劫',ZHI[d.diJie]],
    ['截空',ZHI[d.jieKong]],['副截空',ZHI[d.jieKong2]],['旬空',ZHI[d.xunKong]],['副旬空',ZHI[d.xunKong2]],
    ['天使',ZHI[d.tianShi]],['天伤',ZHI[d.tianShang]],['红鸾',ZHI[d.hongLuan]],['天喜',ZHI[d.tianXi]],
    ['孤辰',ZHI[d.guChen]],['寡宿',ZHI[d.guaSu]],['龙池',ZHI[d.longChi]],['凤阁',ZHI[d.fengGe]],
    ['天哭',ZHI[d.tianKu]],['天虚',ZHI[d.tianXu]],['华盖',ZHI[d.hg]],['咸池',ZHI[d.xc]],
    ['破碎',ZHI[d.ps]],['蜚廉',ZHI[d.fl]],['天刑',ZHI[d.tianXing]],['天姚',ZHI[d.tianYao]],
    ['三台',ZHI[d.sanTai]],['八座',ZHI[d.baZuo]],['台辅',ZHI[d.taiFu]],['封诰',ZHI[d.fengGao]],
    ['天官',ZHI[d.tianGuan]],['天福',ZHI[d.tianFu]],['恩光',ZHI[d.enGuang]],['天贵',ZHI[d.tianGui]],['天厨',ZHI[d.tc]],
    ['岁建',ZHI[d.suiJian]],['晦气',ZHI[d.huiQi]],['丧门',ZHI[d.sangMen]],['贯索',ZHI[d.guanSuo]],['官符',ZHI[d.guanFu]],
    ['小耗',ZHI[d.xiaoHao]],['大耗',ZHI[d.daHao]],['龙德',ZHI[d.longDe]],['白虎',ZHI[d.baiHu]],['天德',ZHI[d.tianDe]],['吊客',ZHI[d.diaoKe]],['病符',ZHI[d.bingFu]],
    ['将星',ZHI[d.jiangXing]],['攀鞍',ZHI[d.panAn]],['岁驿',ZHI[d.suiYi]],['息神',ZHI[d.xiShen]],
    ['劫煞',ZHI[d.jieSha]],['灾煞',ZHI[d.zaiSha]],['天煞',ZHI[d.tianSha]],['指背',ZHI[d.zhiBei]],['月煞',ZHI[d.yueSha]],['亡神',ZHI[d.wangShen]],
    ['博士',ZHI[d.boShi]],['力士',ZHI[d.liShi]],['青龙',ZHI[d.qingLong]],['将军',ZHI[d.jiangJun]],['奏书',ZHI[d.zouShu]],
    ['喜神',ZHI[d.xiShen2]],['伏兵',ZHI[d.fuBing]],['官府',ZHI[d.guanFu2]],['飞廉',ZHI[d.feiLian2]]
  ];
  allStars.forEach(([n,z])=>{
    const gong=zhiToGong[z]||"";
    html+=`<div class="desc-item"><div class="k">${n}</div><div class="v">${z}·${gong}</div></div>`;
  });
  html+=`</div></div>`;
  html+=`<div class="section-block"><h3>大限起运</h3><div class="desc-grid">`;
  d.daLim.list.forEach((x,i)=>{
    html+=`<div class="desc-item"><div class="k">${i===0?'命宫':'第'+(i+1)+'大限'}</div><div class="v">${ZHI[x.zhi]}宫 · ${x.start}-${x.end}岁</div></div>`;
  });
  html+=`</div></div>`;
  html+=`<div class="note">紫微斗数排盘以农历年月时定命身宫（年柱按农历正月初一，非八字立春），命宫天干以五虎遁定寅首，依命宫干支纳音定五行局，安紫微星系与天府星系共十四主星。四化飞星按生年天干（禄权科忌），流年四化按流年天干。大限由命宫起，每宫十年，阳男阴女顺行、阴男阳女逆行，起运岁数即五行局数。长生十二神依五行局安，阳男阴女顺行、阴男阳女逆行。天马依年支、天空地劫依生时、截空旬空按年干（正副双星）、天使在疾厄宫、天伤在交友宫、命主依命宫地支、身主依生年支、魁钺按年干（六辛逢虎马）。星曜亮度（庙旺利陷）依据《紫微斗数全书》。</div>`;
  html+=`</div>`;
  document.getElementById('zw-result').innerHTML=html;
}

/* ======================== 奇门遁甲 ======================== */
 // 1-9宫

 // 六仪三奇
// 九宫顺序(洛书): 戴九履一,左三右七,二四为肩,六八为足
 // 九宫数字排列(1-9宫在3x3中的位置)
function qmNow(){
  const n=beijingNow();
  document.getElementById('qm-date').value=fmtLocalDate(n);
  const h=n.getHours();
  document.getElementById('qm-hour').value=h===23||h<1?0:Math.floor((h+1)/2)%12;
  qmCast();
}
// 24节气三元局数表(索引=TERM_NAMES: 0小寒1大寒2立春3雨水4惊蛰5春分6清明7谷雨8立夏9小满10芒种11夏至12小暑13大暑14立秋15处暑16白露17秋分18寒露19霜降20立冬21小雪22大雪23冬至)
// 值=[上元,中元,下元], 口诀: 阳遁"冬至惊蛰一七四,小寒二八五,大寒春分三九六,立春八五二,雨水九六三,清明立夏四一七,谷雨小满五二八,芒种六三九"; 阴遁"夏至白露九三六,小暑八二五,大暑秋分七一四,立秋二五八,处暑一四七,寒露立冬六九三,霜降小雪五八二,大雪四七一"

// 拆补法定元: 自节气当天起找第一个符头(甲/己日)为上元起点, 每5日一元循环(上中下)


function qmCast(){
  try{
  const mode=parseInt(document.getElementById('qm-mode').value);
  let dateStr,hourIdx,minute=0,hourHH;
  if(mode===0){
    const n=beijingNow();
    dateStr=fmtLocalDate(n);
    hourHH=n.getHours(); minute=n.getMinutes();
    hourIdx=(hourHH===23||hourHH===0)?0:Math.floor((hourHH+1)/2)%12;
    const tEl=document.getElementById('qm-time');
    if(tEl) tEl.value=String(hourHH).padStart(2,'0')+':'+String(minute).padStart(2,'0');
    const hEl=document.getElementById('qm-hour');
    if(hEl) hEl.value=hourIdx;
  }else{
    dateStr=document.getElementById('qm-date').value;
    if(!dateStr){alert('请选择日期');return;}
    const tStr=(document.getElementById('qm-time').value||'').trim();
    if(tStr){
      const parts=tStr.split(':').map(Number);
      hourHH=isNaN(parts[0])?0:parts[0];
      minute=isNaN(parts[1])?0:parts[1];
      hourIdx=(hourHH===23||hourHH===0)?0:Math.floor((hourHH+1)/2)%12;
      const hEl=document.getElementById('qm-hour');
      if(hEl) hEl.value=hourIdx;
    }else{
      hourIdx=parseInt(document.getElementById('qm-hour').value);
    }
  }
  let school=parseInt(document.getElementById('qm-school').value);
  if(isNaN(school)) school=1;
  if(school===2) school=1; // 旧记录茅山法(2)已弃用, 归一为拆补法
  const [y,m,d]=dateStr.split('-').map(Number);
  const date=parseCivilDate(dateStr);
  if(isNaN(date.getTime())){alert('请输入有效日期');return;}
  date.setHours(hourHH===undefined?hourIdx*2:hourHH,minute,0,0);
  // 定局
  const result=calculateQimen({date,hourIdx,school,minute,hourHH});
  const {juInfo}=result;renderQM(result);
  // 保存奇门排盘历史
  try{
    const lunarQ=solar2lunar(date);
    saveModRecord('qm',{mode,dateStr,hourIdx,minute,hourHH:date.getHours(),school,
      title:(juInfo.yang?'阳':'阴')+'遁'+juInfo.ju+'局·'+TERM_NAMES[juInfo.termIdx],
      lunarText:lunarQ.year+'年'+(lunarQ.isLeap?'闰':'')+lunarMonthName(lunarQ.month,lunarQ.isLeap)+lunarDayName(lunarQ.day)});
  }catch(e){}
  }catch(e){alert(e.message||String(e));}
}
// 时支→九宫(丑寅艮8 辰巳巽4 未申坤2 戌亥乾6)

// 地盘: 六仪三奇按局数宫起顺(阳)/逆(阴)布九宫(含中宫,中宫乙奇寄坤2)

// 各宫原九星/八门/八神



// 天盘九星(转盘): 值符星=旬首宫原星, 加临时干宫, 其余按宫序顺排

// 人盘八门(转盘): 值使门=旬首宫原门, 加临时干宫, 其余按八宫序顺排(5中无门)

// 八神(转盘): 值符神(序列首)加临时干宫, 阳遁沿八宫正序顺排、阴遁沿逆序排布(5中无神)

function renderQM(d){
  const {ju,yang,yuan,termIdx}=d.juInfo;
  const date=d.date;
  let html=`<div class="result"><div class="result-title">奇门遁甲盘 </div>`;
  // 时间信息条(精确到分钟)
  let timeTxt=`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
  if(d.hourHH!==undefined&&d.minute!==undefined){
    timeTxt+=` <b>${String(d.hourHH).padStart(2,'0')}:${String(d.minute).padStart(2,'0')}</b>`;
  }
  html+=`<div class="info-bar">`;
  html+=`<span>时间：<b>${timeTxt}</b> ${HOUR_NAMES[d.hourIdx]}</span>`;
  html+=`<span>干支：<b>${GAN[d.dayGZ[0]]}${ZHI[d.dayGZ[1]]}日 ${GAN[d.hourGZ[0]]}${ZHI[d.hourGZ[1]]}时</b></span>`;
  html+=`<span>${yang?'阳':'阴'}遁：<b>${ju}局</b></span>`;
  html+=`<span>节气：<b>${TERM_NAMES[termIdx]}</b></span>`;
  html+=`<span>三元：<b>${['上元','中元','下元'][yuan]}</b></span></div>`;
  // 地盘六仪三奇
  const diPan=placeYi(ju,yang);
  // 时干落宫(天盘值符/值使加临时干)
  const hourGanGong=Object.keys(diPan).find(g=>diPan[g]===GAN[d.hourGZ[0]])?Number(Object.keys(diPan).find(g=>diPan[g]===GAN[d.hourGZ[0]])):d.zfGong;
  // 天盘九星 / 人盘八门 / 八神
  const tianPan=placeStarsTian(d.zfGong,hourGanGong);
  const baMen=placeMenZhuan(d.zfGong,hourGanGong);
  const baShen=placeShenZhuan(d.zfGong,hourGanGong,yang);
  // 天盘干: 星带地盘干转(值符星原宫的地盘干=时干, 随星入时干宫)
  const tianOffset=(((d.zfGong-1)-(hourGanGong-1))%9+9)%9;
  const tianGan={};
  for(let g=1;g<=9;g++){ const orig=((g-1+tianOffset)%9)+1; tianGan[g]=diPan[orig]||''; }
  // 旬空(空亡): 时柱所在旬空出二支
  const hIdx60k=gzIndex(d.hourGZ[0],d.hourGZ[1]);
  const hHeadZhi=Math.floor(hIdx60k/10)*10%12;
  const xunKongZhis=[(hHeadZhi+10)%12,(hHeadZhi+11)%12];
  const xunKongGongs=xunKongZhis.map(z=>zhiGongMap[z]||0);
  // 值符星/值使门
  const zfStar=GONG_STAR[d.zfGong]||"天禽";
  const zfMen=GONG_MEN[d.zfGong]||"";
  // 3x3网格,洛书数: 4 9 2 / 3 5 7 / 8 1 6
  const gridNums=[4,9,2,3,5,7,8,1,6];
  html+=`<div class="qm-grid">`;
  gridNums.forEach(gNum=>{
    if(gNum===5){
      html+=`<div class="qm-cell center"><div class="gong-num">5</div><div class="gong-name">中宫</div><div style="text-align:center;color:var(--ink3);font-size:.68rem;padding:10px 4px">天禽(寄坤2)<br>${diPan[gNum]||""}</div></div>`; return;
    }
    const gongName=QM_GONG[gNum-1];
    const star=tianPan[gNum]||"";
    const men=baMen[gNum]||"";
    const di=diPan[gNum]||"";
    const tg=tianGan[gNum]||"";
    const sh=baShen[gNum]||"";
    const isZf=(gNum===hourGanGong); // 值符星/值符神所在(时干落宫)
    const isFuGong=(gNum===d.zfGong); // 旬首宫(值符落宫)
    const isKong=xunKongGongs.includes(gNum); // 旬空宫
    const isZhiShi=(men===zfMen&&zfMen);
    html+=`<div class="qm-cell${isFuGong?' fu-cell':''}"><div class="gong-num">${gNum}宫</div><div class="gong-name">${gongName}宫${isFuGong?'<span style="color:var(--gold);font-size:.58rem;margin-left:3px">旬首</span>':''}${isKong?'<span class="xk">空</span>':''}</div>`;
    html+=`<div class="row"><span>天盘干</span><b>${tg}</b></div>`;
    html+=`<div class="row"><span>天盘星</span><b>${star}${isZf?'<em style="font-style:normal;color:var(--gold);font-size:.6rem">值符</em>':''}</b></div>`;
    html+=`<div class="row"><span>人盘门</span><b>${men}${isZhiShi?'<em style="font-style:normal;color:var(--gold);font-size:.6rem">值使</em>':''}</b></div>`;
    html+=`<div class="row"><span>地盘</span><b>${di}</b></div>`;
    html+=`<div class="row"><span>八神</span><b>${sh}${isZf?'<em style="font-style:normal;color:var(--gold);font-size:.6rem">神</em>':''}</b></div>`;
    html+=`</div>`;
  });
  html+=`</div>`;
  // 排盘要素
  html+=`<div class="section-block"><h3>排盘要素</h3><div class="desc-grid">`;
  html+=`<div class="desc-item"><div class="k">遁类/局数</div><div class="v">${yang?'阳遁':'阴遁'}${ju}局（${['上元','中元','下元'][yuan]}）</div></div>`;
  html+=`<div class="desc-item"><div class="k">定局法</div><div class="v">${d.school===0?'置闰法':'拆补法'}</div></div>`;
  html+=`<div class="desc-item"><div class="k">节气</div><div class="v">${TERM_NAMES[termIdx]}</div></div>`;
  html+=`<div class="desc-item"><div class="k">时旬首</div><div class="v">${GAN[d.xunHeadGZ[0]]}${ZHI[d.xunHeadGZ[1]]}（${['甲子戊','甲戌己','甲申庚','甲午辛','甲辰壬','甲寅癸'][Math.floor(gzIndex(d.hourGZ[0],d.hourGZ[1])/10)]}）</div></div>`;
  html+=`<div class="desc-item"><div class="k">旬空</div><div class="v">${xunKongZhis.map(z=>ZHI[z]).join('、')}（${xunKongGongs.map(g=>QM_GONG[g-1]+g+'宫').join('、')}）</div></div>`;
  html+=`<div class="desc-item"><div class="k">值符落宫</div><div class="v">${QM_GONG[d.zfGong-1]}${d.zfGong}宫（${zfStar}）</div></div>`;
  html+=`<div class="desc-item"><div class="k">值使门</div><div class="v">${zfMen||'—'}</div></div>`;
  html+=`<div class="desc-item"><div class="k">时干落宫</div><div class="v">${GAN[d.hourGZ[0]]}落${QM_GONG[hourGanGong-1]}${hourGanGong}宫</div></div>`;
  html+=`</div></div>`;
  html+=`<div class="note">时家奇门转盘排法：依节气（${TERM_NAMES[termIdx]}）与日干支${d.school===0?'置闰法（日干支三分）':'拆补法（符头甲己日定元）'}定阴阳遁局数，六仪三奇按局数顺（阳）逆（阴）布九宫为地盘；天盘干随九星转动（值符星带时干加临）；值符星（旬首宫原九星）加临时干宫，其余九星顺排为天盘；值使门（旬首宫原八门）加临时干宫，其余八门顺排为人盘；八神随值符顺（阳）逆（阴）转。中宫天禽寄坤二宫。时间可精确到分钟，自动换算时辰（含晚子时）。</div>`;
  html+=`</div>`;
  document.getElementById('qm-result').innerHTML=html;
}

/* ======================== 六爻 ======================== */


 // 上中下(阳1阴0)


let lyYaoSeq=[]; // 铜钱摇卦: 每爻背面数(0-3)
function lyModeChange(){
  const m=parseInt(document.getElementById('ly-mode').value);
  const w=document.getElementById('ly-yao-wrap');
  if(w) w.style.display=(m===2)?'flex':'none';
  if(m===2){ lyYaoSeq=[]; }
  updateYaoStatus();
}
function lyYaoOne(){
  if(lyYaoSeq.length>=6) lyYaoSeq=[];
  lyYaoSeq.push(Math.floor(Math.random()*4)); // 0-3枚背面
  updateYaoStatus();
  if(lyYaoSeq.length===6) lyCast();
}
function lyYaoAuto(){
  lyYaoSeq=[];
  for(let i=0;i<6;i++) lyYaoSeq.push(Math.floor(Math.random()*4));
  updateYaoStatus();
  lyCast();
}
function updateYaoStatus(){
  const el=document.getElementById('ly-yao-status');
  if(!el) return;
  if(!lyYaoSeq||!lyYaoSeq.length){ el.textContent='已摇 0/6'; return; }
  const names=lyYaoSeq.map(n=>n===3?'⚊老阳○':n===2?'⚊少阳':n===1?'⚋少阴':'⚋老阴×');
  el.textContent='已摇 '+lyYaoSeq.length+'/6：'+names.join(' ');
}
// 卦名→六十四卦索引: up*8+down


function lyCast(){
  try{
  const mode=parseInt(document.getElementById('ly-mode').value);
  const dateStr=document.getElementById('ly-date').value;
  const hourIdx=parseInt(document.getElementById('ly-hour').value);
  const numStr=document.getElementById('ly-num').value;
  const result=calculateLiuyao({mode,dateStr,hourIdx,numStr,yaoSeq:lyYaoSeq});
 const {upGua,downGua,dongYao}=result;renderLY(result);
  // 保存六爻排盘历史
  try{
    saveModRecord('ly',{mode,dateStr,hourIdx,nums:mode===1?numStr:(mode===2?(lyYaoSeq||[]).join(''):''),
      title:GUA_NAMES[upGua*8+downGua]||(BAGUA[upGua]+BAGUA[downGua])+(dongYao?'·动'+dongYao+'爻':'·静卦')});
  }catch(e){}
  }catch(e){alert(e.message||String(e));}
}
function renderLY(d){
  const upName=BAGUA[d.upGua],downName=BAGUA[d.downGua];
  const guaName=GUA_NAMES[d.upGua*8+d.downGua]||(upName+downName);
  const changeName=GUA_NAMES[d.changeUp*8+d.changeDown]||(BAGUA[d.changeUp]+BAGUA[d.changeDown]);
  const dongCnt=d.dongMarks?d.dongMarks.filter(x=>x).length:0;
  let html=`<div class="result"><div class="result-title">六爻卦盘 </div>`;
  html+=`<div class="info-bar">`;
  html+=`<span>主卦：<b>${guaName}（${upName}上${downName}下）</b></span>`;
  html+=`<span>动爻：<b>${dongCnt===0?'静卦（无动爻）':dongCnt===1?('第'+d.dongYao+'爻'):('多爻动（'+d.dongMarks.map((v,i)=>v?['初','二','三','四','五','上'][i]+'爻':'').filter(Boolean).join('、')+'）')}</b></span>`;
  html+=`<span>变卦：<b>${changeName}</b></span></div>`;
  // 月建/日辰/旬空信息条
  let jianTxt='',riChenTxt='',xunKongArr=[];
  if(d.dateStr){
    const dd=new Date(d.dateStr);
    if(!isNaN(dd)){
      const termIdx=getTermIndex(dd);
      const mz=getMonthZhi(termIdx);
      jianTxt=ZHI[mz];
      const dayGZ=getDayGZ(dd);
      riChenTxt=ZHI[dayGZ[1]];
      // 旬空: 日柱所在旬空出二支
      const dIdx=gzIndex(dayGZ[0],dayGZ[1]);
      const head=Math.floor(dIdx/10)*10;
      const hz=head%12;
      xunKongArr=[((hz+10)%12),((hz+11)%12)];
    }
  }
  html+=`<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:2px 0 12px;font-size:.76rem;color:var(--ink2)">
  ${jianTxt?`<span style="background:var(--card2);border:1px solid var(--line);padding:4px 12px;border-radius:12px">月建：<b>${jianTxt}</b></span>`:''}
  ${riChenTxt?`<span style="background:var(--card2);border:1px solid var(--line);padding:4px 12px;border-radius:12px">日辰：<b>${riChenTxt}</b></span>`:''}
  ${xunKongArr.length?`<span style="background:var(--card2);border:1px solid var(--line);padding:4px 12px;border-radius:12px">旬空：<b>${xunKongArr.map(z=>ZHI[z]).join(' ')}</b></span>`:''}
  </div>`;
  // 六爻表(从上到下: 上爻到初爻)
  html+=`<table class="ly-table"><thead><tr><th>爻位</th><th>阴阳</th><th>纳甲</th><th>六亲</th><th>六神</th><th>状态</th></tr></thead><tbody>`;
  const nayinMap=getNaJia(d.upGua,d.downGua);
  // 世应(含卦宫)
  const shiYing=getShiYing(d.upGua,d.downGua);
  const gong=shiYing.gong!==undefined?shiYing.gong:d.downGua;
  // 六神按占卜日天干起(甲乙青龙/丙丁朱雀/戊勾陈/己螣蛇/庚辛白虎/壬癸玄武)
  const shenStart=[0,0,1,1,2,3,4,4,5,5][d.dayGan]||0;
  for(let i=6;i>=1;i--){
    const idx=i-1;
    const yin=d.sixYao[idx];
    const isDong=d.dongMarks&&d.dongMarks[idx];
    const symbol=yin?"━━━━━":"━━ ━━";
    const nj=nayinMap[idx];
    const gz=GAN[nj[0]]+ZHI[nj[1]];
    const qin=getLiuQin(nj[1],gong);
    const shen=LIUSHEN[(shenStart+(6-i))%6];
    const isKong=xunKongArr.includes(nj[1]);
    const shiFlag=i===shiYing.shi?'<span style="color:var(--gold);font-size:.62rem">世</span>':'';
    const yingFlag=i===shiYing.ying?'<span style="color:var(--jade);font-size:.62rem">应</span>':'';
    html+=`<tr class="${isDong?'dong-row':''}"><td class="yao-pos">${["初","二","三","四","五","上"][i-1]}爻${shiFlag}${yingFlag}${isDong?'<span style="color:var(--red)">·动</span>':''}</td>`;
    html+=`<td class="yao-symbol" style="color:${yin?'var(--yang)':'var(--yin)'}">${symbol}${isDong?(d.yaoSeq&&d.yaoSeq[idx]===3?'○':d.yaoSeq&&d.yaoSeq[idx]===0?'×':dongCnt?'○':' '):' '}</td>`;
    html+=`<td class="yao-info"><span class="gz">${gz}</span></td>`;
    html+=`<td class="yao-info"><span class="qin">${qin}${isKong?'<span style="color:var(--orange);font-size:.6rem">空</span>':''}</span></td>`;
    html+=`<td class="yao-info"><span class="shen">${shen}</span></td>`;
    html+=`<td class="yao-info" style="font-size:.66rem;color:var(--ink3)">${isKong?'旬空':'—'}</td></tr>`;
  }
  html+=`</tbody></table>`;
  // 世应
  html+=`<div class="section-block"><h3>世应与卦宫</h3><div class="desc-grid">`;
  html+=`<div class="desc-item"><div class="k">世爻</div><div class="v">第${shiYing.shi}爻</div></div>`;
  html+=`<div class="desc-item"><div class="k">应爻</div><div class="v">第${shiYing.ying}爻</div></div>`;
  html+=`<div class="desc-item"><div class="k">卦宫</div><div class="v">${BAGUA[gong]}宫（六亲以${['乾金','兑金','离火','震木','巽木','坎水','艮土','坤土'][gong]}为"我"）</div></div>`;
  html+=`</div></div>`;
  // 变卦
  html+=`<div class="section-block"><h3>变卦：${changeName}</h3><div style="font-size:.82rem;color:var(--ink2);line-height:1.9">`;
  for(let i=6;i>=1;i--){
    const yin=d.changedSix[i-1];
    const isDong=d.dongMarks&&d.dongMarks[i-1];
    html+=`${["初","二","三","四","五","上"][i-1]}爻: <span style="color:${yin?'var(--yang)':'var(--yin)'}">${yin?"━━━━━":"━━ ━━"}</span>${isDong?' <span style="color:var(--red);font-size:.7rem">变</span>':''}<br>`;
  }
  html+=`</div></div>`;
  // 互卦/错卦/综卦
  const der=lyDerived(d.upGua,d.downGua);
  html+=`<div class="section-block"><h3>互卦 · 错卦 · 综卦</h3><div class="desc-grid">`;
  html+=`<div class="desc-item"><div class="k">互卦</div><div class="v">${GUA_NAMES[der.huU*8+der.huD]||(BAGUA[der.huU]+BAGUA[der.huD])}（二三四五爻）</div></div>`;
  html+=`<div class="desc-item"><div class="k">错卦</div><div class="v">${GUA_NAMES[der.cuoU*8+der.cuoD]||(BAGUA[der.cuoU]+BAGUA[der.cuoD])}（阴阳全变）</div></div>`;
  html+=`<div class="desc-item"><div class="k">综卦</div><div class="v">${GUA_NAMES[der.zongU*8+der.zongD]||(BAGUA[der.zongU]+BAGUA[der.zongD])}（上下颠倒）</div></div>`;
  html+=`</div></div>`;
  // 断卦要素
  html+=`<div class="section-block"><h3>断卦参考</h3><div style="font-size:.78rem;color:var(--ink2);line-height:1.9">`;
  html+=`· 用神定位：父母为文书长辈、兄弟为同辈朋友、子孙为子女福神、妻财为钱财妻室、官鬼为事业灾祸。<br>`;
  html+=`· 生克：用神得日辰月建生扶为旺，受冲克为衰；世爻为自身，应爻为所测之事。<br>`;
  html+=`· 动爻为事情变化关键，动爻化出之爻（变爻）看吉凶走向；${xunKongArr.length?('旬空：'+xunKongArr.map(z=>ZHI[z]).join('、')+'，用神临空须待出空填实。'):''}<br>`;
  html+=`· 六神参断：青龙主喜庆、朱雀主口舌、勾陈主田土迟滞、螣蛇主虚惊、白虎主刑伤、玄武主暗昧。<br>`;
  html+=`· 本卦主现状，变卦主结局，互卦主过程；${dongCnt>1?'多爻动以世爻、用神所在之动爻为主断。':'一爻动看动爻，静卦看世爻与用神旺衰。'}</div></div>`;
  html+=`<div class="note">六爻以卦象断事。主卦为现状，变卦为趋势，动爻为关键。世爻代表自己，应爻代表他人或事。纳甲配六亲（以卦宫五行为"我"）定用神，六神参看性情，旬空月破为衰象。断卦需结合用神旺衰、动变生克综合判断。</div>`;
  html+=`</div>`;
  document.getElementById('ly-result').innerHTML=html;
}
// 互卦/错卦/综卦



// 京房八宫卦变: 生成64卦世应表(up*8+down索引)




/* ======================== 综合排盘 ======================== */
// 紫微主星性格
const ZW_CHAR={
  ziwei:"紫微坐命：帝王气象，稳重有领导力，自尊心强，好面子",
  tianji:"天机坐命：聪敏善谋，心思机巧，好动多变，思虑较多",
  taiyang:"太阳坐命：光明磊落，热情开朗，乐于助人，好善乐施",
  wuqu:"武曲坐命：刚毅果决，执行力强，理财有道，性格刚直",
  tiantong:"天同坐命：温和知足，随缘自在，人缘好，享福之命",
  lianzhen:"廉贞坐命：次桃花主，才艺出众，情绪起伏，重情义",
  tianfu:"天府坐命：稳重厚实，有库藏之能，善理财，衣食无忧",
  taiyin:"太阴坐命：内敛细腻，心思敏感，温文尔雅，喜静少言",
  tanlang:"贪狼坐命：主桃花才艺，多才多艺，欲望强烈，善交际",
  jumen:"巨门坐命：口才伶俐，善辩是非，注意口舌，学识广博",
  tianxiang:"天相坐命：公正温和，辅佐之才，乐于助人，处世圆融",
  tianliang:"天梁坐命：清高正直，有荫庇之德，喜助人，晚福佳",
  qisha:"七杀坐命：果断威猛，行动力强，敢作敢当，性格刚烈",
  pojun:"破军坐命：开创进取，破坏后立，变动较大，敢闯敢拼"
};
function zhNow(){
  const now=beijingNow();
  document.getElementById('zh-solar').value=fmtLocalDate(now);
  const h=now.getHours();
  document.getElementById('zh-hour').value=h===23||h<1?0:Math.floor((h+1)/2)%12;
  document.getElementById('zh-cal').value='0';
  document.getElementById('zh-time').value=String(h).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  zhToggleCal();
  zhCast();
}
function zhGetDate(){
  if(document.getElementById('zh-cal').value==='0') return parseCivilDate(document.getElementById('zh-solar').value);
  return lunar2solar(Number(document.getElementById('zh-ly').value),Number(document.getElementById('zh-lm').value),Number(document.getElementById('zh-ld').value),document.getElementById('zh-ll').value==='1');
}
function zhCast(){
  showCastLoading();
  setTimeout(()=>{
    try{
    let date=zhGetDate();
    if(!date||isNaN(date.getTime())){hideCastLoading();alert('请输入有效的日期');return;}
    const hourIdx=parseInt(document.getElementById('zh-hour').value);
    const minute=parseInt(document.getElementById('zh-minute').value);
    const genderRaw=parseInt(document.getElementById('zh-gender').value);
    const gender=genderRaw===2?1:genderRaw; // 不提供→按男计算,展示时标注
    const name=document.getElementById('zh-name').value.trim();
    const school2Raw=parseInt(document.getElementById('zh-school2').value);
    const school2=(school2Raw>=0&&school2Raw<=4)?school2Raw:0; // 防御: 空值→NaN→SCHOOLS[NaN]显示undefined
    const place=document.getElementById('zh-place').value.trim();
    const trueSun=parseInt(document.getElementById('zh-true-sun').value)===1;
    const unknowHour=parseInt(document.getElementById('zh-unknow-hour').value)===1;
    const time=document.getElementById('zh-time').value;
    const dayBoundary=document.getElementById('zh-day-boundary').value;
    const options={...readCalculationOptions('zh',school2),dayBoundary,trueSolar:trueSun};
    if(unknowHour){
      aiEvidenceLeave();
      const result=unknownBirthCandidates(date,place,options);
      lastZh=null;lastCandidates=result;lastName=name;lastSchool=school2;
      localStorage.setItem('mingli_school',school2);
      renderUnknownCandidates(result,name);saveUnknownRecord(result,name,gender,school2,genderRaw===2);return;
    }
    date=withBirthTime(date,hourIdx,time,minute);
    const zh=zhCompute(date,hourIdx,gender,place,options);
    lastCandidates=null;
    zh.time=time;zh.trueSun=trueSun;zh.genderUnspecified=genderRaw===2;
    zh.precisionNote=time?'输入时分精确到分钟；按所选标准时偏移和手动夏令时修正换算':'仅知时辰：按所选时辰中点小时及分钟估算，无法确定交节与换日边界；请补充具体时分';
    // 附加输入信息
    zh.solarNote=temporalDescription(zh);
    zh.unknowHour=unknowHour;
    zh.minute=minute;
    zh.place=place;
    lastZh=zh; lastName=name; lastSchool=school2;
    localStorage.setItem('mingli_school',school2);
    renderZongHe(zh,name);
    saveRecord(zh,name);
    hideCastLoading();
    animateResult();
    }catch(e){alert(e.message||String(e));}finally{hideCastLoading();}
  }, 350);
}
/* ======================== 轻量动效系统 ======================== */
function showCastLoading(){
  let el=document.getElementById('cast-loading');
  if(!el){
    el=document.createElement('div');
    el.id='cast-loading';
    el.className='cast-loading';
    el.innerHTML='<div class="label">推演中</div><div class="sub">八字 · 紫微 · 奇门 · 六爻</div>';
    document.body.appendChild(el);
  }
  setTimeout(()=>el.classList.add('show'),10);
}
function hideCastLoading(){
  const el=document.getElementById('cast-loading');
  if(el) el.classList.remove('show');
}
function animateResult(){
  const root=document.getElementById('zh-result');
  if(!root) return;
  const blocks=root.querySelectorAll('.section-block');
  blocks.forEach((b,i)=>{ b.classList.add('reveal'); setTimeout(()=>b.classList.add('in'), 180*i+200); });
  setTimeout(()=>{ root.querySelectorAll('.wxbar-bar').forEach(b=>b.classList.add('in')); }, 800);
  setTimeout(()=>{ root.querySelectorAll('.desc-item,.tag').forEach((d,i)=>{ d.style.opacity='0'; d.style.transform='translateY(8px)'; d.style.transition='opacity .4s ease,transform .4s ease'; setTimeout(()=>{d.style.opacity='1';d.style.transform='';}, 40*i+800); }); }, 1000);
  setTimeout(animateDaYunNumbers, 1200);
  markRollNumbers();
}
function animateDaYunNumbers(){
  const els=document.querySelectorAll('[data-roll]');
  els.forEach(el=>{
    const target=parseFloat(el.dataset.roll);
    const start=performance.now(); const dur=900;
    function step(now){
      const p=Math.min((now-start)/dur,1);
      const ease=0.5-0.5*Math.cos(Math.PI*p);
      el.textContent=Math.round(target*ease);
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
function initInteractionFX(){
  // 轻量交互: 仅保留按钮按压反馈(无磁吸/无涟漪)
  document.querySelectorAll('.btn').forEach(b=>{
    if(b._fxInited) return; b._fxInited=true;
    b.addEventListener('mousedown',()=>{ b.style.transform='scale(.97)'; });
    b.addEventListener('mouseup',()=>{ b.style.transform=''; });
    b.addEventListener('mouseleave',()=>{ b.style.transform=''; });
  });
}
// 数字滚动支持: 在大运年龄上添加 data-roll
function markRollNumbers(){
  document.querySelectorAll('.dy-table td:last-child').forEach(td=>{
    const m=td.textContent.match(/(\d+)-(\d+)/);
    if(m){ const a=parseInt(m[1]); const span=document.createElement('span'); span.textContent=a; span.className='roll-num'; span.dataset.roll=a; td.innerHTML=''; td.appendChild(document.createTextNode(a+'-')); const sp2=document.createElement('span'); sp2.textContent=m[2]; sp2.dataset.roll=m[2]; td.appendChild(sp2); }
  });
}
window.addEventListener('load',initInteractionFX);
window.addEventListener('load',markRollNumbers);
// 分享: 生成命盘摘要文本
let lastZh=null,lastName='',lastSchool=(()=>{const v=parseInt(localStorage.getItem('mingli_school')||'0');return (v>=0&&v<=4)?v:0;})();
let lastAIReply=''; // AI 上次解读全文(供追问/导出使用)
// 真太阳时校正(经度差+均时差近似): 返回{offsetMin,trueTime,note}
function zhTrueSolarTime(date,hourIdx,minute,place){
  const value=trueSolarTime(withBirthTime(date,hourIdx,'',minute),resolveLongitude(place));
  return {...value,note:'真太阳时修正 '+value.offsetMin.toFixed(2)+'分钟；日期偏移 '+value.dayOffset+'日'};
}
function buildShareText(zh,name){
  let s=' 玄机命理排盘 · 命盘分享\n━━━━━━━━━━━━━━\n';
  s+='姓名：'+(name||'未命名')+'（'+genderLabel(zh)+'）\n';
  s+='公历：'+zh.date.getFullYear()+'年'+(zh.date.getMonth()+1)+'月'+zh.date.getDate()+'日 '+HOUR_NAMES[zh.hourIdx]+'\n';
  s+='农历：'+zh.lunar.year+'年'+(zh.lunar.isLeap?'闰':'')+lunarMonthName(zh.lunar.month,zh.lunar.isLeap)+lunarDayName(zh.lunar.day)+'\n';
  s+='生肖：'+"鼠牛虎兔龙蛇马羊猴鸡狗猪"[zh.yearGZ[1]]+'\n';
  s+='四柱：'+zh.pillars.map(g=>GAN[g[0]]+ZHI[g[1]]).join(' ')+'\n';
  s+='时间规则：'+temporalDescription(zh)+'\n';
  s+='日主：'+GAN[zh.dg]+WUXING[GAN_WX[zh.dg]]+'（'+(strengthLabel(zh))+'，喜用'+WUXING[zh.yongShen]+'）\n';
  s+='紫微：命宫'+ZHI[zh.mingGong]+'宫 · '+['水二','木三','金四','土五','火六'][zh.ju-2]+'局\n';
  s+='奇门：'+(zh.juInfo.yang?'阳':'阴')+'遁'+zh.juInfo.ju+'局\n';
  s+='六爻：'+zh.guaName+'卦，'+['初','二','三','四','五','上'][zh.dongYao-1]+'爻动，变'+zh.changeName+'\n';
  s+='━━━━━━━━━━━━━━\n(由「玄机命理排盘」生成 · 仅供传统文化学习参考)';
  return s;
}
function shareCopy(){
  if(!lastZh){alert('请先排盘');return;}
  const txt=buildShareText(lastZh,lastName);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>{alert('✅ 命盘摘要已复制，可直接粘贴到微信/QQ分享给朋友！');}).catch(()=>{shareFallback(txt);});
  }else{ shareFallback(txt); }
}
function shareFallback(txt){
  const ta=document.createElement('textarea');
  ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); alert('✅ 命盘摘要已复制，可直接粘贴分享！'); }catch(e){ alert('复制失败，请手动选择复制：\n\n'+txt); }
  document.body.removeChild(ta);
}
function copyText(txt,msg){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>{ alert(msg); }).catch(()=>{ shareFallback2(txt,msg); });
  }else{ shareFallback2(txt,msg); }
}
function shareFallback2(txt,msg){
  const ta=document.createElement('textarea');
  ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); alert(msg); }catch(e){ alert('复制失败，请手动复制：\n\n'+txt); }
  document.body.removeChild(ta);
}
/* ======================== 排盘记录 ======================== */
function getRecords(){
  try{migrateLegacyRecords();return readStoredRecords(REC_KEY);}catch(e){console.warn('主记录读取失败：'+e.message);return [];}
}
function saveRecord(zh,name){
  migrateLegacyRecords();
  let recs=readStoredRecords(REC_KEY);
  const bazi=zh.pillars.map(g=>GAN[g[0]]+ZHI[g[1]]).join(' ');
  const lunarText=zh.lunar.year+'年'+(zh.lunar.isLeap?'闰':'')+lunarMonthName(zh.lunar.month,zh.lunar.isLeap)+lunarDayName(zh.lunar.day);
  const dateStr=fmtLocalDate(zh.inputDate||zh.date);
  // 相同姓名+日期+时辰则更新
  const idx=recs.findIndex(r=>r.name===name&&r.dateStr===dateStr&&r.hourIdx===hourIndexAt(zh.inputDate||zh.date)&&(r.time||'')===(zh.time||'')&&(r.dayBoundary||'zi-chu')===(zh.temporal?.dayBoundary||'zi-chu'));
  const rec={id:idx>=0?recs[idx].id:(Date.now()+''+Math.floor(Math.random()*1000)),name,gender:zh.gender,dateStr,hourIdx:hourIndexAt(zh.inputDate||zh.date),bazi,lunarText,ts:Date.now(),time:zh.time||'',minute:zh.minute||0,place:zh.place||'',trueSun:!!zh.trueSun,unknowHour:!!zh.unknowHour,genderUnspecified:!!zh.genderUnspecified,dayBoundary:zh.temporal?.dayBoundary||'zi-chu',school2:lastSchool,utcOffsetMinutes:zh.temporal.utcOffsetMinutes,dstMinutes:zh.temporal.dstMinutes,wxMode:zh.wxStatistics.mode};
  if(idx>=0){if(recs[idx].note!==undefined)rec.note=recs[idx].note;recs[idx]=rec;}else recs.unshift(rec);
  if(recs.length>50) recs=recs.slice(0,50);
  try{ localStorage.setItem(REC_KEY,JSON.stringify(recs)); }catch(e){}
  renderRecords();
}
function renderRecords(){
  const wrap=document.getElementById('zh-records-wrap');
  if(!wrap) return;
  const recs=getRecords();
  if(!recs.length){ wrap.style.display='none'; return; }
  wrap.style.display='';
  let html='<div class="rec-list">';
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  recs.forEach(r=>{
    const rid=esc(r.id), rname=esc(r.name), rds=esc(r.dateStr), rlt=esc(r.lunarText), rbazi=esc(r.bazi||r.pillars||'');
    html+=`<div class="rec-item" onclick="recordReload('${rid}')"><div class="rec-main"><div class="rec-name">${rname||'未命名'} ${r.gender===1?'♂':'♀'}</div><div class="rec-meta">${rds} · ${r.unknowHour?'时辰未知':HOUR_NAMES[r.hourIdx]||''} · ${rlt}</div><div class="rec-bazi">${rbazi.split(' ').map(g=>'<b>'+g+'</b>').join(' ')}</div></div><button class="rec-del" onclick="event.stopPropagation();recordDelete('${rid}')">删除</button></div>`;
  });
  html+='</div>';
  html+=`<div class="rec-tools"><button class="rec-clear" onclick="clearRecords()"> 清空全部记录</button></div>`;
  html+=`<div class="tip">点击记录可重新排盘；记录保存在浏览器本地（localStorage）。</div>`;
  document.getElementById('zh-records').innerHTML=html;
}
function recordReload(id){
  const recs=getRecords();
  const r=recs.find(x=>String(x.id)===String(id));
  if(!r) return;
  // 恢复表单
  document.getElementById('zh-name').value=r.name||'';
  document.getElementById('zh-gender').value=r.genderUnspecified?2:r.gender;
  document.getElementById('zh-cal').value='0';
  zhToggleCal();
  document.getElementById('zh-solar').value=r.dateStr;
  zhSyncFromSolar();
  document.getElementById('zh-hour').value=r.hourIdx;
  document.getElementById('zh-time').value=r.time||'';
  restoreUtcOffset('zh-utc-offset',r.utcOffsetMinutes??480);
  document.getElementById('zh-dst').value=r.dstMinutes||0;
  document.getElementById('zh-wx-mode').value=r.wxMode||'stems-main-qi';
  document.getElementById('zh-minute').value=r.minute||0;
  document.getElementById('zh-place').value=r.place||'';
  document.getElementById('zh-true-sun').value=r.trueSun?'1':'0';
  document.getElementById('zh-unknow-hour').value=r.unknowHour?'1':'0';
  document.getElementById('zh-unknow-hour').dispatchEvent(new Event('change'));
  document.getElementById('zh-day-boundary').value=r.dayBoundary||'zi-chu';
  if(r.school2!==undefined) document.getElementById('zh-school2').value=r.school2;
  zhCast();
  // 滚动到顶部结果
  const el=document.getElementById('zh-result');
  if(el) el.scrollIntoView({behavior:'smooth'});
}
function recordDelete(id){
  let recs=getRecords();
  recs=recs.filter(r=>r.id!==id);
  try{ localStorage.setItem(REC_KEY,JSON.stringify(recs)); }catch(e){}
  renderRecords();
}
function clearRecords(){
  if(!confirm('确定清空全部排盘记录？此操作不可恢复。')) return;
  try{ localStorage.removeItem(REC_KEY); localStorage.removeItem('mingli_records'); }catch(e){}
  renderRecords();
}
/* ======================== 各子功能排盘历史 ======================== */
function getModRecords(mod){
  try{return readStoredRecords(MOD_REC_KEYS[mod]);}catch(e){console.warn('模块记录读取失败：'+e.message);return [];}
}
function saveModRecord(mod,rec){
  let recs=readStoredRecords(MOD_REC_KEYS[mod]);
  const key=mod+'|'+rec.dateStr+'|'+rec.hourIdx;
  const idx=recs.findIndex(r=>r.key===key);
  const id=idx>=0?recs[idx].id:(Date.now()+''+Math.floor(Math.random()*1000));
  rec=Object.assign({},idx>=0?recs[idx]:{},rec,{id,key,ts:Date.now()});
  if(idx>=0) recs[idx]=rec; else recs.unshift(rec);
  if(recs.length>50) recs=recs.slice(0,50);
  try{ localStorage.setItem(MOD_REC_KEYS[mod],JSON.stringify(recs)); }catch(e){}
  renderModRecords(mod);
}
function modRecMeta(mod,r){
  const gender=r.gender===1?'♂':r.gender===0?'♀':'';
  const h=HOUR_NAMES[r.hourIdx]||'';
  let extra='';
  if(mod==='zw') extra='·'+(r.style===1?'三合精简':'三合派');
  if(mod==='bz') extra='·'+(r.school===0?'子时换日':'晚子时不换日')+((r.school2>=0&&r.school2<=4)?'·'+['综合','旺衰','盲派','格局','调候'][r.school2]:'');
  if(mod==='qm') extra='·'+(r.mode===0?'此刻':['置闰','拆补','拆补'][r.school===2?1:r.school]||'拆补')+(r.minute!==undefined?'·'+String(r.hourHH!==undefined?String(r.hourHH).padStart(2,'0')+'：':'')+String(r.minute).padStart(2,'0')+'分':'');
  if(mod==='ly') extra=r.nums?(r.mode===2?('·摇卦 '+r.nums):'·三数 '+r.nums):'·时间起卦';
  return {gender,h,extra};
}
function renderModRecords(mod){
  const wrap=document.getElementById(mod+'-records-wrap');
  if(!wrap) return;
  const recs=getModRecords(mod);
  if(!recs.length){ wrap.style.display='none'; return; }
  wrap.style.display='';
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  let html='<div class="rec-list">';
  recs.forEach(r=>{
    const m=modRecMeta(mod,r);
    const rid=esc(r.id),rds=esc(r.dateStr),rlt=esc(r.lunarText||''),rsub=esc(r.bazi||r.title||'');
    const mextra=esc(m.extra);
    html+=`<div class="rec-item" onclick="modRecordReload('${mod}','${rid}')"><div class="rec-main"><div class="rec-name">${rds} ${m.gender}${mextra}</div><div class="rec-meta">${r.unknowHour?'时辰未知':HOUR_NAMES[r.hourIdx]||''} · ${rlt}</div>${rsub?`<div class="rec-bazi">${rsub.split(' ').map(g=>'<b>'+g+'</b>').join(' ')}</div>`:''}</div><button class="rec-del" onclick="event.stopPropagation();modRecordDelete('${mod}','${rid}')">删除</button></div>`;
  });
  html+='</div>';
  html+=`<div class="rec-tools"><button class="rec-clear" onclick="clearModRecords('${mod}')">清空全部记录</button></div>`;
  html+=`<div class="tip">点击记录可重新排盘；记录保存在浏览器本地（localStorage）。</div>`;
  document.getElementById(mod+'-records').innerHTML=html;
}
function modRecordReload(mod,id){
  const recs=getModRecords(mod);
  const r=recs.find(x=>String(x.id)===String(id));
  if(!r) return;
  if(mod==='zw'){
    document.getElementById('zw-date').value=r.dateStr;
    document.getElementById('zw-hour').value=r.hourIdx;
    document.getElementById('zw-gender').value=r.gender;
    if(r.style!==undefined) document.getElementById('zw-style').value=r.style;
    zwCast();
  }else if(mod==='bz'){
    document.getElementById('bz-name').value=r.name||'';
    document.getElementById('bz-date').value=r.dateStr;
    document.getElementById('bz-hour').value=r.hourIdx;
    document.getElementById('bz-gender').value=r.gender;
    if(r.school!==undefined) document.getElementById('bz-school').value=r.school;
    if(r.school2!==undefined) document.getElementById('bz-school2').value=r.school2;
    document.getElementById('bz-time').value=r.time||'';
    restoreUtcOffset('bz-utc-offset',r.utcOffsetMinutes??480);
    document.getElementById('bz-dst').value=r.dstMinutes||0;
    document.getElementById('bz-wx-mode').value=r.wxMode||'stems-main-qi';
    bzCast();
  }else if(mod==='qm'){
    document.getElementById('qm-mode').value=1; // 历史记录固定按指定时间重排
    document.getElementById('qm-date').value=r.dateStr;
    document.getElementById('qm-hour').value=r.hourIdx;
    const tEl=document.getElementById('qm-time');
    if(tEl){
      if(r.hourHH!==undefined&&r.minute!==undefined){ tEl.value=String(r.hourHH).padStart(2,'0')+':'+String(r.minute).padStart(2,'0'); }
      else{ tEl.value=''; }
    }
    if(r.school!==undefined) document.getElementById('qm-school').value=(r.school===2?1:r.school); // 茅山已弃用→拆补
    qmCast();
  }else if(mod==='ly'){
    document.getElementById('ly-mode').value=r.mode;
    document.getElementById('ly-date').value=r.dateStr;
    document.getElementById('ly-hour').value=r.hourIdx;
    if(r.nums) document.getElementById('ly-num').value=r.nums;
    if(r.mode===2){
      // 恢复摇卦序列
      const seq=String(r.nums||'').split('').map(Number).filter(n=>!isNaN(n));
      lyYaoSeq=seq.length===6?seq:[];
      updateYaoStatus();
      const w=document.getElementById('ly-yao-wrap');
      if(w) w.style.display='flex';
    }else{
      lyYaoSeq=[];
      updateYaoStatus();
    }
    lyCast();
  }
  const el=document.getElementById(mod+'-result');
  if(el) el.scrollIntoView({behavior:'smooth'});
}
function modRecordDelete(mod,id){
  let recs=getModRecords(mod);
  recs=recs.filter(r=>String(r.id)!==String(id));
  try{ localStorage.setItem(MOD_REC_KEYS[mod],JSON.stringify(recs)); }catch(e){}
  renderModRecords(mod);
}
function clearModRecords(mod){
  if(!confirm('确定清空该模块全部排盘记录？此操作不可恢复。')) return;
  try{ localStorage.removeItem(MOD_REC_KEYS[mod]); }catch(e){}
  renderModRecords(mod);
}
/* ======================== 进阶命理要素(对标主流App) ======================== */
// 十二长生

 // 甲亥乙午丙寅丁酉戊寅己酉庚巳辛子壬申癸卯

// 八宅命卦

// 五行能量条形图
function wxBar(wxCount){
  const total=wxCount.reduce((a,b)=>a+b,0)||1;
  const wxClr=['#2e8b57','#c0392b','#b8860b','#8a8d93','#2f6da8']; // 直接色,不依赖主题变量
  let s='';
  WUXING.forEach((w,i)=>{
    const pct=Math.round(wxCount[i]/total*100);
    s+=`<div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="width:30px;font-size:.78rem;color:var(--ink3);font-weight:600">${w}</span><div style="flex:1;height:18px;background:var(--card2);border-radius:5px;overflow:hidden;border:1px solid var(--line);box-shadow:inset 0 1px 2px rgba(0,0,0,.06)"><div style="width:${pct}%;height:100%;background:${wxClr[i]};border-radius:4px;box-shadow:0 0 6px ${wxClr[i]}55;transition:width .6s"></div></div><span style="width:60px;font-size:.72rem;color:var(--ink2);font-variant-numeric:tabular-nums">${wxCount[i]} · ${pct}%</span></div>`;
  });
  return s;
}
// 术语解释弹窗
function showTerm(kw){
  // 复用新版术语弹窗(分类色+现代样式); 无词条时给出更友好的提示
  if(KB_TERMS[kw]) return termTip(kw);
  const mask=document.createElement('div');
  mask.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  mask.onclick=()=>mask.remove();
  mask.innerHTML='<div style="background:var(--card);border:1px solid var(--gold2);border-radius:14px;padding:18px 22px;max-width:380px;margin:0 16px;box-shadow:0 8px 40px rgba(0,0,0,.3)" onclick="event.stopPropagation()"><div style="color:var(--gold);font-weight:700;margin-bottom:8px;font-size:.95rem;font-family:\'Noto Serif SC\',serif"> '+esc0(kw)+' <span style="font-size:.7rem;color:var(--ink3);font-weight:400">(术语)</span></div><div style="font-size:.82rem;line-height:1.9;color:var(--ink2)">该术语暂未收录释义。可点击「🤖 提取 Prompt」让 AI 结合本命盘讲解。</div><div style="margin-top:12px;text-align:right"><button class="btn btn-ghost" onclick="this.parentElement.parentElement.parentElement.remove()" style="padding:4px 14px;font-size:.76rem">关 闭</button></div></div>';
  document.body.appendChild(mask);
}
// 可点击术语span
function tsSpan(tag,name){
  return `<span class="ten-god" style="cursor:pointer;border-bottom:1px dashed var(--gold2)" onclick="showTerm('${name}')" title="点击查看「${name}」详解">${tag}</span>`;
}
// 古籍智能匹配(对标问真智能古籍推荐)
function matchClassics(zh){
  const refs=[];
  refs.push({book:'穷通宝鉴',ref:'余春台',where:'以'+WUXING[zh.yongShen]+'为调候用神',quote:'十干配十二月中气候之宜',app:strengthText(zh,'日主身强、宜泄宜耗、取其流通','日主身弱、宜印比生扶、取其帮扶')});
  if(zh.caiKu.length) refs.push({book:'滴天髓',ref:'刘伯温·任铁樵',where:'命中带财库（'+zh.caiKu.map(z=>ZHI[z]).join('、')+'）',quote:'何知其人富，财气通门户',app:'财库逢冲则开、逢合则闭，宜细察大运之机'});
  else refs.push({book:'滴天髓',ref:'刘伯温·任铁樵',where:zh.caiWei.length?'财星见于'+zh.caiWei.join('、'):'财星不显',quote:'何知其人富，财气通门户',app:'身强财旺者富、身弱财多者劳，取舍之间见命主之机'});
  if(zh.tsCount[6]+zh.tsCount[7]>=2) refs.push({book:'子平真诠',ref:'沈孝瞻',where:'官杀'+(zh.tsCount[6]+zh.tsCount[7])+'位透/藏',quote:'八字用神，专求月令',app:'官杀有制化为权、无制多劳，格局成败全在相神救应'});
  if(zh.mainTenGods[0]&&[2,3].includes(zh.mainTenGods[0].i)) refs.push({book:'神峰通考',ref:'张楠',where:'食伤吐秀、'+SHISHEN_NAME[zh.mainTenGods[0].i]+'当令',quote:'有病方为贵，无伤不是奇',app:'才华外露者须防伤官见官之患，有制方成器'});
  if(zh.tsCount[8]+zh.tsCount[9]>=2) refs.push({book:'渊海子平',ref:'徐大升',where:'印绶'+zh.tsCount[8]+'位、偏印'+zh.tsCount[9]+'位',quote:'印绶生身、庇护有源',app:'学识深广、贵人提携，逢印绶运利考试深造'});
  if(zh.tiaoHouWX>=0) refs.push({book:'穷通宝鉴',ref:'余春台',where:'生于'+(zh.tiaoHouWX===1?'冬月':'夏月')+',宜'+WUXING[zh.tiaoHouWX]+'调候',quote:'调候为用、急则治标',app:(zh.tiaoHouPlaceNote?'寒暖燥湿得宜则气机通畅，'+zh.tiaoHouPlaceNote+'；':'')+'行运逢调候之神可成大器'});
  return refs;
}
// 十神心法(王家荣实战断语,按命局主要十神匹配)
const TS_XINFA={
  0:{t:"比肩心法",d:"比肩重财轻，喜管闲事、惹是生非、轻视钱财；比肩多者性格刚烈、性情暴躁、易孤独。比肩为喜用而相逢，兄弟联手、根基巩固，反为美事。需平衡自我与协作，方可聚人聚财。"},
  1:{t:"劫财心法",d:"劫财重者性格固执、自我中心强、孤独不善交际；比劫重则夫妻多口角争斗；比劫过多正偏财少，主迟婚或同居难成。劫财夺财，轻财不俭。宜学克制与分享，方免破耗。"},
  2:{t:"食神心法",d:"食神温和，主口福才艺；食神生偏财，本性风流；食伤泄秀虽聪明，然无财官配合难言富贵；食伤重而无印，福气不足、体弱多病。宜以食神养财、以印护身。"},
  3:{t:"伤官心法",d:"伤官聪明伶俐、才华外露；伤官克官，生性不羁、易生是非；伤官重正官弱，一生懦弱难担大事；伤官高透逢羊刃，聪明刚烈易闯祸。才华须有约束，方成栋梁。"},
  4:{t:"偏财心法",d:"偏财主机遇之财、慷慨人脉，男命亦主父亲；偏财为用神，父母家境丰裕；偏财双双透出，轻财好义、多欲多情；命局多偏财，思想易走偏。善抓机遇，亦须守正。"},
  5:{t:"正财心法",d:"正财主稳定之财、勤俭务实，男命亦主正妻；正财为用神，妻子贤惠有助力；身弱财旺且财透，为人豪爽慷慨、金钱不聚；正财为忌神，克妻破财。财星得位，因妻致富成家。"},
  6:{t:"七杀心法",d:"七杀主魄力压力、威权竞争；杀印相生，功名发达、文武双全；七杀无制又与正官混杂，多风波、多灾多难；七杀重身弱易冲动，外勇内怯；有杀无印，劳碌辛苦。制杀得宜，反成大器。"},
  7:{t:"正官心法",d:"正官主名誉地位、自律规则；男命官星强旺，子女多；正官化为忌神，劳苦、事业常有闪失；正官被合，虚名假利。官星为用，堂堂正正；官星为忌，束缚难伸。"},
  8:{t:"偏印心法",d:"偏印主独特思维、钻研灵感；偏印过旺而无财星克制，福分减少、辛苦劳碌；正偏印同现，两业在身；女命偏印夺食，克子女。奇思妙想须有财官为之收束。"},
  9:{t:"正印心法",d:"正印主学识涵养、仁慈庇护；正印为用神，正直爱面子、有智慧仁慈；印星化解七杀，言而有信、有权威；杀印相生，为人诚实重信用；印星强旺多操心，与子女缘分浅。"}
};
function shishenXinfa(zh){
  // 取命局最强的2-3个十神(排除日主本身)
  const list=[];
  zh.mainTenGods.forEach(t=>{
    if(t.c>=2&&TS_XINFA[t.i]) list.push(TS_XINFA[t.i]);
  });
  return list;
}
// 星座
function getZodiac(date){
  const m=date.getMonth()+1,d=date.getDate();
  const starts=[[1,20,'水瓶'],[2,19,'双鱼'],[3,21,'白羊'],[4,20,'金牛'],[5,21,'双子'],[6,22,'巨蟹'],[7,23,'狮子'],[8,23,'处女'],[9,23,'天秤'],[10,24,'天蝎'],[11,23,'射手'],[12,22,'摩羯']];
  let cur='摩羯';
  for(const [mm,dd,n] of starts){
    if(m>mm||(m===mm&&d>=dd)) cur=n;
  }
  return cur+'座';
}
// 当前节气名
function curTermName(date){
  return TERM_NAMES[getTermIndex(date)];
}
// 节气交接临近提示: 出生日距最近"节"(12节,决定月柱)≤3天时提示月柱可能变动
function jieqiNearNote(date){
  try{
    const y=date.getFullYear();
    const out=[];
    for(let i=0;i<24;i+=2){
      const jm=Math.floor(i/2);
      const jd=solarTermDay(y,i);
      const diff=Number(((solarTerms(y)[i]-civilMillis(date))/86400000).toFixed(2));
      if(diff>=0&&diff<=3) out.push({name:TERM_NAMES[i],diff});
    }
    const jd2=solarTermDay(y+1,0); // 次年小寒
    const diff2=Number(((solarTerms(y+1)[0]-civilMillis(date))/86400000).toFixed(2));
    if(diff2>=0&&diff2<=3) out.push({name:TERM_NAMES[0],diff:diff2});
    return out;
  }catch(e){return [];}
}
// 日主五行性格基调
const GAN_CHAR=[
  "甲木之性，正直进取、仁慈有主见，独立性强，行事有始有终",
  "乙木之性，柔韧温和、善解人意，适应力强，心思细腻",
  "丙火之性，热情开朗、光明磊落，行动力强，喜交善友",
  "丁火之性，温和内敛、洞察敏锐，重情重义，富文艺气质",
  "戊土之性，稳重厚实、诚信可靠，包容力强，行事踏实",
  "己土之性，温和包容、心思细密，善于协调，富亲和力",
  "庚金之性，刚毅果断、重义轻财，执行力强，不惧困难",
  "辛金之性，精致敏锐、追求完美，重品位，自尊心强",
  "壬水之性，豁达聪慧、善谋善变，胸襟开阔，社交力强",
  "癸水之性，智慧内敛、思虑缜密，直觉敏锐，沉稳低调"
];
// 十神性格影响
const TS_CHAR=[
  "比肩强旺则独立自主、自尊心强，朋友缘好但稍显固执",
  "劫财强旺则重义轻利、竞争心强，朋友众多但需防破财",
  "食神强旺则温和乐观、有口福才艺，心境随和知足",
  "伤官强旺则聪明伶俐、才华外露，心高气傲、喜表现",
  "偏财强旺则慷慨大方、善抓机遇，人脉广、来财快",
  "正财强旺则务实节俭、脚踏实地，重稳定、理财有方",
  "七杀强旺则果断刚烈、有魄力，抗压能力强、敢作敢当",
  "正官强旺则自律稳重、责任感强，正直有原则、重名誉",
  "偏印强旺则思维独特、善钻研，多思多虑、偏于内向",
  "正印强旺则重视学识、仁慈宽厚，学习能力强、有涵养"
];
const WX_ORGAN=["肝胆","心小肠","脾胃","肺大肠","肾膀胱"];
// 地支对应身形(盲派象法)
const ZHI_BODY={0:'肾、膀胱、血液、泌尿',1:'脾、胃、子宫、性器官',2:'头、肝胆、筋脉、神经',3:'肝胆、颈项、四肢、腰',4:'膀胱、内分泌、肌肤、淋巴',5:'心脏、咽喉、面齿、眼目',6:'心、小肠、眼舌、血压',7:'脾胃、腹、口腔、脊梁',8:'肺、大肠、骨、脊椎、气管',9:'肺、肋、耳、齿、骨骼',10:'心包、命门、背、胃、腿踝',11:'肾、膀胱、尿道、血脉'};
// 十天干取象(盲派象法)
const GAN_XIANG={0:'甲木·直·栋梁，性宽仁磊落、卓立高贵',1:'乙木·曲·藤蔓，性朴实善良、柔情儒雅',2:'丙火·太阳·绚丽，性体恤正面、热情多言',3:'丁火·星光·亮点，性文雅多思、神秘智慧',4:'戊土·大地·形盛，性忠厚老成、沉稳有担当',5:'己土·田园·卑微，性含蓄谨慎、心思细密',6:'庚金·顽铁·肃杀，性刚强威武、固执理性',7:'辛金·珠玉·精细，性通达柔润、灵动好面子',8:'壬水·江河·通达，性智谋好动、任性能干',9:'癸水·雨露·圆润，性智谋机敏、温柔聪慧'};
const WX_INDUSTRY=["木：教育、文化、出版、医药、纺织、园艺","火：能源、电子、餐饮、传媒、美容、照明","土：地产、建筑、农业、矿业、仓储、中介","金：金融、机械、五金、军警、法律、汽车","水：物流、贸易、旅游、渔业、咨询、IT"];
function zhXingGe(zh){
  const dayWX=WUXING[GAN_WX[zh.dg]];
  let s=`日主${GAN[zh.dg]}${dayWX}，生于${ZHI[zh.monthGZ[1]]}月。${GAN_CHAR[zh.dg]}。`;
  // 天干取象(盲派象法)
  s+=`取象论之：${GAN_XIANG[zh.dg]}。`;
  if(zh.mainTenGods.length){
    s+=TS_CHAR[zh.mainTenGods[0].i]+'。';
    if(zh.mainTenGods.length>1 && zh.mainTenGods[1].c>=2) s+=TS_CHAR[zh.mainTenGods[1].i].replace('强旺','亦显')+'。';
  }
  const rz=zh.dayGZ[1], rzWX=WUXING[ZHI_WX[rz]];
  s+=`日坐${ZHI[rz]}（${rzWX}），${rzWX===dayWX?'气归自身，心性专一而坚定，认准之事九牛不回':(GAN_WX[zh.dg]+4)%5===ZHI_WX[rz]?'坐印得生，心地仁厚、内秀有涵养，遇事自有主见':'日支耗泄，内心常有权衡，外静内动、外柔内刚'}。`;
  const stTxt={'从弱':'从弱之格，随势而行，心思机敏、善借时势，唯防随波逐流、失却主见','身弱':'身弱性柔，亲和温婉、心思细密，善体人意，唯防优柔寡断，宜以印比助身而立','中和':'五行中和，性情平稳、不偏不倚，处世圆融，贵在保持与精进','身强':'身强气足，自信果断、敢作敢当，是能扛事之人，唯防固执自专、听不进劝，宜多纳人言','身极强':'身极强旺，气势如虹、魄力过人，然刚极易折，须以财官泄制、柔以济之'};
  s+=stTxt[zh.strengthType]||stTxt['中和']+'。';
  if(zh.mingStars.length) s+=`紫微佐证：${ZW_CHAR[zh.mingStars[0]]}。`;
  s+=`总观之，${dayWX}性为骨、${zh.mainTenGods.length?SHISHEN_NAME[zh.mainTenGods[0].i]+'气':''}为血肉，内外呼应，性格立体而鲜活。`;
  // 四柱论仪表断语
  if(zh.tsCount[2]+zh.tsCount[3]>=2) s+=`仪表：《四柱论仪表》'伤官泄秀，红粉佳人'，伤官吐秀则容貌清秀、气质出尘；`;
  else if(zh.tsCount[6]>=2) s+=`仪表：七杀重而有制，面容威严、眉宇有英气；`;
  else s+=`仪表：五行平和，气色端凝，风度自然。`;
  return s;
}
function zhCaiFu(zh){
  const caiTotal=zh.caiZheng+zh.caiPian;
  let s=`命局财星：正财${zh.caiZheng}位、偏财${zh.caiPian}位，${zh.caiWei.length?'财星见于'+zh.caiWei.join('、'):'财星不显于四柱'}。`;
  if(zh.strong) s+=`日主身强，能任财官，财来可担、能赚能守，是发家之基；`;
  else if(strengthLabel(zh)==='中和') s+=`日主中和，财星承受与取用须结合格局及行运，不按身弱套用；`;
  else if(zh.congGe) s+=`日主从弱，财官食伤按从势规则考察；`;
  else if(caiTotal>=3) s+=`身弱财多，如弱水浮舟，财重压身，劳心费力，宜合作分财、借力生财，勿独吞独扛；`;
  else if(caiTotal===0) s+=`财星不显，财缘淡泊，反宜精进本事、以技养财，待大运引出财星自然渐旺；`;
  else s+=`身弱而有财，财星有制，宜稳中求进，先以印比护身再图财；`;
  if(zh.caiPian>zh.caiZheng) s+=`偏财旺于正财，主机遇之财：来财偏快、嗅觉敏锐，善抓风口，然大起大落，忌贪多求快、见好即收；`;
  else if(zh.caiZheng>0) s+=`正财为体，收入稳定、细水长流，宜储蓄理财、实业深耕，财不露白；`;
  if(zh.tsCount[2]+zh.tsCount[3]>0) s+=`且食伤生财，可凭一技之长生财——专业技能、手艺创意皆是您的财源，胜过守株待兔；`;
  if(zh.caiKu.length) s+=`命中带财库（${zh.caiKu.map(z=>ZHI[z]).join('、')}），财有库藏，中年后聚财之力渐显，逢冲库之大运财源大开；`;
  else s+=`财无库藏，得财易散，宜养成定投储蓄之习，量入为出；`;
  // 赚钱特质(王家荣: 主星赚钱特征)
  const earn=[];
  if(zh.tsCount[4]>0) earn.push('偏财主星，善抓机会、大小钱皆有心，财路广开');
  if(zh.tsCount[3]>0) earn.push('伤官主星，有危机意识、肯学第二专长，凭本事增值');
  if(zh.tsCount[0]>0) earn.push('比肩主星，勤劳务实、钱多钱少皆肯做，脚踏实地');
  if(earn.length) s+=`赚钱特质：${earn.join('；')}。`;
  // 经典断语
  if(zh.caiZheng>=2) s+=`《渊海子平》云'身财俱旺，一生乐守'，正财有力而身强，守成积富之象；`;
  if(zh.tsCount[2]>0&&zh.caiTotal>=1) s+=`又云'财藏官透，家道兴隆'，财官有气，家业可期。`;
  const caiDy=zh.dy.dyList.find(dy=>[4,5].includes(tenGod(zh.dg,dy.g)));
  if(caiDy) s+=`大运中${GAN[caiDy.g]}${ZHI[caiDy.z]}（${caiDy.age}-${caiDy.endAge}岁）为财星运，是求财之最佳窗口，宜早布局、大胆落地。`;
  return s;
}
function zhHunYin(zh){
  const isMale=zh.gender===1;
  let s=isMale?`男命以财为妻，妻星${zh.hunCount}位；`:`女命以官杀为夫，夫星${zh.hunCount}位；`;
  if(zh.hunCount===0) s+=`夫妻星不显，感情宜晚成，早恋多波折，配偶多来自远缘或经人介绍，缘到自然成，莫强求；`;
  else if(zh.hunCount<=2) s+=`夫妻星得位，姻缘有定，宜把握适婚之龄，主动则不误；`;
  else s+=`夫妻星多现，异性缘佳，然多则惑，须防感情多扰，择一而定方安；`;
  s+=`夫妻宫坐${ZHI[zh.fuQiGong]}，主气${SHISHEN_NAME[zh.fqTs]}，`;
  const fqWX=ZHI_WX[zh.fuQiGong], dayWX=GAN_WX[zh.dg];
  if(fqWX===dayWX) s+=`配偶与己性情相近、志趣相投，相互懂得，然同气相求亦易同病相争，相处宜留空间；`;
  else if((dayWX+4)%5===fqWX) s+=`配偶具护持之性，关怀体贴、包容付出，是能旺己之人；`;
  else if((dayWX+1)%5===fqWX) s+=`配偶才情外露、活泼有艺，相处有情有趣，唯防其异性缘亦佳；`;
  else s+=`配偶个性与己互补，一刚一柔、一急一缓，磨合中见深情，包容为上；`;
  if(zh.taoHua>=0&&[zh.yearGZ[1],zh.monthGZ[1],zh.dayGZ[1],zh.hourGZ[1]].includes(zh.taoHua)) s+=`命带桃花（${ZHI[zh.taoHua]}），魅力人缘佳，婚前多选择，婚后须自律；桃花若落夫妻宫，反主夫妻情深。`;
  if(isMale && zh.caiZheng>0 && zh.caiPian>0) s+=`正偏财并透，感情丰富，婚恋宜专一，防情债缠身；`;
  if(isMale && zh.fqTs===5) s+=`日坐正财，妻贤持家有方，婚姻安稳之象；`;
  if(isMale && zh.fqTs===4) s+=`日坐偏财，妻善经营、旺夫之象，然防感情多向外；`;
  if(!isMale && (zh.fqTs===7||zh.fqTs===6)) s+=`日坐官杀，夫缘在身，然官杀为夫亦为压力，宜择刚柔相济之配；`;
  s+=`婚配宜选${WUXING[(dayWX+2)%5]}或${WUXING[(dayWX+3)%5]}五行之人，性格相济、气场合拍。`;
  // v5.10 合婚配对入口 + 最近合婚摘要(填入婚姻感情卡片)
  try{
    const hhInfo=JSON.parse(localStorage.getItem('mingli_hh_last')||'null');
    if(hhInfo&&hhInfo.b){
      s+=`<div style="margin-top:9px;padding:8px 11px;background:var(--card2);border:1px solid var(--gold2);border-radius:8px;font-size:.74rem;line-height:1.75"><b style="color:var(--gold)">💍 最近合婚</b>：与「${esc0(hhInfo.b)}」合盘 <b style="color:${hhInfo.score>=70?'var(--jade)':hhInfo.score>=55?'var(--gold)':'var(--orange)'}">${esc0(hhInfo.score)}</b> 分（${esc0(hhInfo.summary)}）${hhInfo.highlights&&hhInfo.highlights.length?(' · 亮点：'+esc0(hhInfo.highlights.join('、'))):''}<br><button type="button" class="btn btn-ghost" onclick="hhGoFromMingpan()" style="font-size:.68rem;padding:3px 10px;margin-top:4px;border-color:var(--gold);color:var(--gold)">查看 / 重新合婚</button></div>`;
    }else{
      s+=`<span style="display:inline-block;margin-top:8px;font-size:.72rem;color:var(--ink3)">💍 想与 TA 合婚配对？<button type="button" class="btn btn-ghost" onclick="hhGoFromMingpan()" style="font-size:.68rem;padding:3px 10px;margin-left:6px;border-color:var(--gold);color:var(--gold)">前往合婚配对</button><span style="font-size:.62rem;color:var(--ink3)">（自动带本命盘，填对方即可）</span></span>`;
    }
  }catch(e){}
  return s;
}
function zhXueYe(zh){
  const yin=zh.tsCount[8]+zh.tsCount[9], shi=zh.tsCount[2]+zh.tsCount[3], guan=zh.tsCount[6]+zh.tsCount[7], cai=zh.tsCount[4]+zh.tsCount[5];
  let s=`学业事业，观印食官财四象：`;
  s+=`印星${yin}位主吸收与学问，${yin>=2?'印旺，记忆与理解俱佳，深造考试皆宜，读书是您的捷径':yin===0?'印星不现，宜实践出真知，边做边学胜于死读':'印星中平，学贵有恒，善用方法可补'}；`;
  s+=`食伤${shi}位主才华输出，${shi>=2?'食伤吐秀，思维活跃、创意出众，技术、艺术、策划类最能发光':shi===0?'才华内敛，宜沉淀积累，厚积薄发':''}`;
  s+=`官杀${guan}位主事业格局，${guan>=2?'官杀有力，利管理仕途、体制内发展，规则之内反而游刃有余':'官杀平，事业求稳，宜深耕专业成专家'}；`;
  s+=`财星${cai}位主商业头脑，${cai>=2?'财星透旺，有经商之智，实业金融可图':'财星平，宜以职养财、副业添彩'}。`;
  const dy0=zh.dy.dyList[0];
  s+=`${zh.dy.startAge}岁起运，首运${GAN[dy0.g]}${ZHI[dy0.z]}（${SHISHEN_NAME[tenGod(zh.dg,dy0.g)]}运）定少年基调：`;
  const tg0=tenGod(zh.dg,dy0.g);
  if([8,9].includes(tg0)) s+=`印运护持，少年学业顺遂，宜趁势深造；`;
  else if([2,3].includes(tg0)) s+=`食伤运聪明外显，然心猿意马，宜引导专注；`;
  else if([6,7].includes(tg0)) s+=`官杀运早熟自律，压力中成长，扛得住则成器；`;
  else s+=`比劫财运平顺，筑基为要，勿虚掷光阴。`;
  // 四柱论官运断语
  if(zh.tsCount[7]>=2) s+=`《四柱论官运》：'官临旺地，光宗耀祖'，正官有力而透，仕途有望；`;
  if(zh.tsCount[6]>=1) s+=`'杀居太岁，居安思危'，七杀临旺须防是非，居安常思危；`;
  if(zh.tsCount[8]+zh.tsCount[9]>=2) s+=`'印绶无伤生身，门庭光彩'，印旺无财破，学业功名可期。`;
  return s;
}
function zhJianKang(zh){
  const sorted=[...zh.wxCount].map((c,i)=>({c,i})).sort((a,b)=>b.c-a.c);
  const ts=sorted[0], tw=sorted[sorted.length-1];
  let s='医易同源，五行应五脏、地支应身形：';
  if(ts.c>=3) s+=`${WUXING[ts.i]}气过旺（${ts.c}分），${WX_ORGAN[ts.i]}偏亢，忌熬夜耗气、忌怒伤其脏，宜以${WUXING[(ts.i+1)%5]}泄之——${['舒展筋骨、多行绿色运动','有氧运动、子时前安眠','静坐调息、少思虑','清淡饮食、润肺养阴','温水养生、护肾藏精'][ts.i]}；`;
  if(tw.c===0||tw.c===1) s+=`${WUXING[tw.i]}气偏弱（${tw.c}分），${WX_ORGAN[tw.i]}宜日常补益：${['多吃绿色蔬果','子时前入睡以养心','细嚼慢咽以养脾胃','深呼吸以润肺','多饮水以护肾'][tw.i]}，起居有常；`;
  if(!s) s+='五行分布相对均衡，体质根基尚可。';
  // 经典断语(四柱论健康)
  if(zh.tsCount[0]+zh.tsCount[1]>=3) s+=`《四柱论健康》云'比肩叠叠，一生少病'，比劫有力则体魄强健；`;
  else if(zh.strong) s+=`日主高强，平生少病，体质根基扎实；`;
  else s+=strengthText(zh,`日主偏旺，宜规律作息；`,`日主偏弱，体质偏于敏感，宜节劳养气；`,`日主中和，健康仍须以实际检查与规律作息为准；`);
  // 地支身形(日支最重,次月时)
  const zhis=[['日',zh.dayGZ[1]],['月',zh.monthGZ[1]],['时',zh.hourGZ[1]],['年',zh.yearGZ[1]]];
  s+=`地支应身形：日坐${ZHI[zh.dayGZ[1]]}主${ZHI_BODY[zh.dayGZ[1]]}，月支${ZHI[zh.monthGZ[1]]}主${ZHI_BODY[zh.monthGZ[1]]}，时支${ZHI[zh.hourGZ[1]]}主${ZHI_BODY[zh.hourGZ[1]]}，此处为先天薄弱之处，宜平素保养。`;
  // 冲刑害对应身形(仅地支)
  const rels=zhGanZhiMap(zh);
  const chong=rels.filter(r=>r.cls==='chong'&&r.t==='地支六冲');
  const xing=rels.filter(r=>r.cls==='xing'&&r.t!=='地支自刑');
  const hai=rels.filter(r=>r.cls==='hai');
  const zIdx=n=>ZHI.indexOf(n.charAt(0));
  if(chong.length) s+=`地支见${chong.map(r=>r.name).join('、')}，其应之身形（${chong.map(r=>ZHI_BODY[zIdx(r.name)]).join('、')}）逢冲之年易受损伤，宜防意外与旧疾。`;
  if(xing.length) s+=`带刑（${xing.map(r=>r.name).join('、')}），所应身形（${xing.map(r=>ZHI_BODY[zIdx(r.name)]).join('、')}）须防慢性劳损。`;
  if(hai.length) s+=`带害（${hai.map(r=>r.name).join('、')}），对应身形（${hai.map(r=>ZHI_BODY[zIdx(r.name)]).join('、')}）防暗损与情绪之疾。`;
  s+=`逢${WUXING[ts.i]}旺之年护${WX_ORGAN[ts.i]}，逢${WUXING[tw.i]}旺之年养${WX_ORGAN[tw.i]}，未病先防。`;
  return s;
}
/* ======================== 综合定档（格局高低·财富区间·人生上下限·学历上下限） ======================== */
function zhDingDang(zh){
  const dw=GAN_WX[zh.dg];
  const ts=zh.tsCount;
  const yin=ts[8]+ts[9], bi=ts[0]+ts[1], shi=ts[2]+ts[3], cai=ts[4]+ts[5], guan=ts[6]+ts[7];
  const yw=zh.yongShen;
  // 得分体系(0-100) 基准40: 命局质量从"中等"起步,避免虚高
  let score=40;
  // ① 得令: 月令是否生扶日主或为用神
  const mz=ZHI_HIDDEN[zh.monthGZ[1]][0], mw=GAN_WX[mz];
  if(mw===dw||mw===(dw+4)%5) score+=12;        // 印比当令
  else if(mw===(dw+2)%5||mw===(dw+3)%5) score-=6; // 财官当令
  // ② 用神力量: 用神五行在盘中的个数(×4,上限12)
  score+=Math.min(zh.wxCount[yw]*4,12);
  if(zh.wxCount[yw]===0) score-=8; // 用神不现,靠行运
  // ③ 通关: 印比是否通根
  const rootScore=zh.pillars.reduce((a,gz)=>a+(ZHI_HIDDEN[gz[1]].some(h=>GAN_WX[h]===dw)?1.5:(ZHI_HIDDEN[gz[1]].some(h=>GAN_WX[h]===(dw+4)%5)?1:0)),0);
  score+=Math.min(rootScore*4,16);
  // ④ 官杀有制: 官杀旺而有食伤制/印化
  if(guan>=2&&(shi>=2||yin>=2)) score+=8;
  else if(guan>=2) score-=6;
  // ⑤ 财官印流通
  if(cai>0&&guan>0&&yin>0) score+=6;
  // ⑥ 格局清纯: 官杀不混杂(正官+七杀)
  if(!(ts[6]>=1&&ts[7]>=1)) score+=3;
  // ⑦ 调候: 冬夏生有调候
  if(zh.tiaoHouWX>=0&&zh.wxCount[zh.tiaoHouWX]>=1) score+=4;
  else if(zh.tiaoHouWX>=0) score-=4;
  // ⑧ 五行流通
  if(zh.wxCount[(dw+4)%5]>0&&zh.wxCount[(dw+1)%5]>0&&zh.wxCount[(dw+2)%5]>0) score+=3;
  // ⑨ 冲刑破格
  const rels=typeof zhGanZhiMap==='function'?zhGanZhiMap(zh):[];
  const chong=rels.filter(r=>r.cls==='chong').length;
  const xing=rels.filter(r=>r.cls==='xing').length;
  score-=chong*2+xing;
  score=Math.max(20,Math.min(95,score));
  // 格局定级
  const geJu=score>=80?'上等格局':score>=60?'中上格局':score>=45?'中等格局':score>=30?'中下格局':'偏弱格局';
  // 财富区间(基于财星+身强任财+财库+大运)
  let caiNeng=30+cai*10+(zh.strong?15:0);
  if(zh.caiKu.length) caiNeng+=10;
  if(zh.wxCount[yw]>0) caiNeng+=10;
  const caiDy=zh.dy.dyList.some(dy=>[4,5].includes(tenGod(zh.dg,dy.g)));
  if(caiDy) caiNeng+=8;
  // 财富区间(10万-百万级量化)
  let caiQuan;
  if(caiNeng>=75) caiQuan='千万级（400万-2000万）';
  else if(caiNeng>=62) caiQuan='百万级·富裕（100万-400万）';
  else if(caiNeng>=48) caiQuan='中产（30万-100万）';
  else caiQuan='小康·安稳（10万-30万）';
  // 人生下限/上限
  const low=score>=60?'中平':score>=45?'平顺':'多劳';
  const high=score>=75?'上乘':score>=55?'中上':'中平';
  // 学历(印星+文昌+官印相生)
  const wenChang=typeof zhShenShaQuan==='function'?zhShenShaQuan(zh).some(s=>s.name==='文昌贵人'):false;
  let xueNeng=40+yin*15+(guan>=1&&yin>=1?10:0)+(wenChang?8:0);
  if(zh.tsCount[8]>=2) xueNeng+=5;
  let xueQuan;
  if(xueNeng>=78) xueQuan='博硕（研究生及以上）';
  else if(xueNeng>=60) xueQuan='本科·重点';
  else if(xueNeng>=45) xueQuan='本科';
  else xueQuan='大专及以下';
  // 综合大运(前/中/后三段喜用占比评估)
  const dyList=zh.dy.dyList||[];
  // 喜用判定: 干支任一属用神/喜神阵营=喜; 都属忌神/仇神阵营=忌; 闲神年看地支是否受伤
  const isGoodDy=dy=>{
    const g=GAN_WX[dy.g], z=ZHI_WX[dy.z];
    return g===yw||z===yw||g===(yw+4)%5||z===(yw+4)%5;
  };
  // 单大运是否"受压": 干支主要是忌神/仇神阵营
  const isHardDy=dy=>{
    const g=GAN_WX[dy.g], z=ZHI_WX[dy.z];
    const gHard=g===(yw+3)%5||g===(yw+2)%5; // 干=忌/仇
    const zHard=z===(yw+3)%5||z===(yw+2)%5; // 支=忌/仇
    return gHard&&zHard;
  };
  const segs=[[0,2,'早年'],[3,5,'中年'],[6,dyList.length-1,'晚年']];
  const dySegs=segs.map(([a,b,label])=>{
    const slice=dyList.slice(a,b+1);
    if(!slice.length) return null;
    const good=slice.filter(isGoodDy).length;
    const hard=slice.filter(isHardDy).length;
    return {label,good,total:slice.length,hard,score:Math.round(good/slice.length*100)};
  }).filter(Boolean);
  let dayunInfo;
  if(dySegs.length===0) dayunInfo='大运未排，行运走向待细推';
  else if(dySegs.every(d=>d.score>=70)) dayunInfo='全程顺运：喜用贯穿一生，格局尽显，中年后可大成';
  else if(dySegs.every(d=>d.score<=30)) dayunInfo='全程逆运：行运不济，宜守成深耕，重命局自身之力';
  else{
    const early=dySegs[0], late=dySegs[dySegs.length-1];
    if(early&&late&&early.score<50&&late.score>=60) dayunInfo='先苦后甜：早年多磨、中年起转佳、晚年可成——贵在坚持';
    else if(early&&late&&early.score>=60&&late.score<50) dayunInfo='先甜后平：早年顺遂、晚运转平，宜早立根基、未雨绸缪';
    else if(dySegs.some(d=>d.hard>=1&&d.score<=40)) dayunInfo='行运起伏，喜中有忌：关键大运突出（如庚辰金运)为低谷，须守待下一转运——典型先立后破再立';
    else dayunInfo='行运起伏，喜忌交错：吉凶参半，贵在把握每个喜用之运';
  }
  const dayunTxt=dySegs.map(d=>d.label+d.good+'/'+d.total).join(' · ');
  // 大运三段分数(用于曲线图)
  const dyScores=dySegs.map(d=>d.score);
  const dyLabels=dySegs.map(d=>d.label);
  // 评分依据明细(弹窗用)
  const basis=[
    {k:'基础分(中等起点)',v:40},
    {k:'月令生扶/财官当令/食伤当令',v:mw===dw||mw===(dw+4)%5?12:mw===(dw+2)%5||mw===(dw+3)%5?-6:0},
    {k:'用神力量(个数×4,上限12)',v:Math.min(zh.wxCount[yw]*4,12)},
    {k:['用神不现-8',zh.wxCount[yw]===0?-8:0][0],v:zh.wxCount[yw]===0?-8:0},
    {k:'印比通根(上限16)',v:Math.min(rootScore*4,16)},
    {k:guan>=2?(shi>=2||yin>=2?'官杀有制':'官杀旺无制'):'官杀未达加减分阈值',v:guan>=2&&(shi>=2||yin>=2)?8:guan>=2?-6:0},
    {k:'财官印流通+6',v:cai>0&&guan>0&&yin>0?6:0},
    {k:'官杀不混杂+3',v:!(ts[6]>=1&&ts[7]>=1)?3:0},
    {k:zh.tiaoHouWX>=0?(zh.wxCount[zh.tiaoHouWX]>=1?'调候到位':'调候缺失'):'无冬夏调候项',v:zh.tiaoHouWX>=0?(zh.wxCount[zh.tiaoHouWX]>=1?4:-4):0},
    {k:'五行流通+3',v:zh.wxCount[(dw+4)%5]>0&&zh.wxCount[(dw+1)%5]>0&&zh.wxCount[(dw+2)%5]>0?3:0},
    {k:`冲${chong}处×-2+刑${xing}处×-1`,v:-(chong*2+xing)}
  ];
  // 结论
  return {
    score:Math.round(score), geJu,
    caiNeng:Math.round(caiNeng), caiQuan,
    lifeLow:low, lifeHigh:high,
    xueNeng:Math.round(xueNeng), xueQuan,
    dayunInfo, dayunTxt, dyScores, dyLabels, basis,
    note:`命局定分${Math.round(score)}（100分制），${geJu}。财星${cai}位${zh.caiKu.length?'带财库':'无库'}、${strengthLabel(zh)}·${strengthAdvice(zh)}，财富潜力${caiQuan}。印星${yin}位，${wenChang?'文昌助力':'文昌不显'}，学历潜力${xueQuan}。`
  };
}
function zhDingDangHtml(zh){
  const d=zhDingDang(zh);
  const bar=(v,color,h,id)=>`<div style="height:${h||8}px;background:var(--line);border-radius:5px;overflow:hidden;margin-top:5px"><div id="${id||''}" style="height:100%;width:${Math.min(100,v)}%;background:${color};border-radius:5px;transition:width 1s ease"></div></div>`;
  // 大号定分头部
  let html=`<div style="display:flex;align-items:center;gap:18px;background:linear-gradient(135deg,rgba(176,138,62,.1),rgba(176,138,62,.03));border:1px solid var(--gold2);border-radius:12px;padding:16px 20px;margin-bottom:12px;flex-wrap:wrap">`;
  html+=`<div style="text-align:center;min-width:120px"><div style="font-size:.68rem;color:var(--ink3);letter-spacing:.2em;margin-bottom:2px">命局定分<span id="dd-ai-badge" style="display:none;margin-left:4px;font-size:.56rem;background:var(--jade);color:#fff;padding:1px 5px;border-radius:6px;letter-spacing:0">AI校准</span></div><div style="font-size:2.6rem;font-weight:800;color:var(--gold);line-height:1.1"><span id="dd-score-num">${d.score}</span><span style="font-size:.9rem;color:var(--ink3)">/100</span></div><div style="font-size:.68rem;color:var(--gold);margin-top:2px" id="dd-geju">${d.geJu}</div></div>`;
  html+=`<div style="flex:1;min-width:220px"><div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--ink2);margin-bottom:4px"><span id="dd-score-desc">${d.score>=80?'天资卓越':d.score>=60?'格局有成':d.score>=45?'中规中矩':'有待行运'}</span><span style="color:var(--ink3)" id="dd-score-lv">${d.score>=80?'上上':d.score>=60?'中上':d.score>=45?'中等':'中下'}</span></div>${bar(d.score,'var(--gold)',10,'dd-score-bar-fill')}<div style="font-size:.68rem;color:var(--ink3);margin-top:4px">得令 · 用神力量 · 通根 · 官杀有制 · 流通 · 冲刑 综合评定<span id="dd-ai-note" style="display:none;color:var(--jade)"> · AI 已校准</span></div></div>`;
  html+=`</div>`;
  // 四项核心
  const item=(label,val,desc,barHtml,color)=>`<div style="flex:1;min-width:150px;padding:10px 12px;background:var(--card2);border:1px solid var(--line);border-radius:10px"><div style="font-size:.7rem;color:var(--ink3);margin-bottom:4px">${label}</div><div style="font-size:.95rem;font-weight:700;color:${color||'var(--gold)'}">${val}</div>${desc?`<div style="font-size:.66rem;color:var(--ink2);margin-top:3px">${desc}</div>`:''}${barHtml||''}</div>`;
  html+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
  html+=item('格局高低',`<span id="dd-geju-card">${d.geJu}</span>`,'月令·用神·流通·冲刑',bar(d.score,'var(--gold)'));
  html+=item('财富区间',d.caiQuan,'财星·身强弱·财库·大运',bar(d.caiNeng,'var(--jade)'),'var(--jade)');
  html+=item('人生下限',d.lifeLow,'最差行运之底','');
  html+=item('人生上限',d.lifeHigh,'喜用运全走之顶','');
  html+=item('学历潜力',d.xueQuan,'印星·文昌·官印',bar(d.xueNeng,'var(--red)'),'var(--red)');
  html+='</div>';
  // 量化雷达图(SVG五维)
  const radarVal={
    ge:Math.round(d.score/100*100), cai:Math.round(d.caiNeng/100*100), xue:Math.round(d.xueNeng/100*100),
    ren:({上乘:95,中上:78,中平:60,平顺:45,多劳:30}[d.lifeHigh]||60),
    dy:Math.round((d.dyScores||[50]).reduce((a,b)=>a+b,0)/(d.dyScores||[50]).length)
  };
  const rv=[radarVal.ge,radarVal.cai,radarVal.xue,radarVal.ren,radarVal.dy];
  const labels=['格局','财富','学历','人生上限','大运'];
  const cw=240,chh=190,cx=cw/2,cy=chh/2-8,rad=68;
  const ang=i=>-Math.PI/2+i*2*Math.PI/5;
  const pxy=(i,r)=>[cx+r*Math.cos(ang(i)),cy+r*Math.sin(ang(i))];
  const grid=Array.from({length:4},(_,k)=>{const r=rad*(k+1)/4;return Array.from({length:5},(_,i)=>pxy(i,r).map(v=>v.toFixed(1)).join(',')).join(' ');}).map(g=>`<polygon points="${g}" fill="none" stroke="var(--line)" stroke-width=".8"/>`).join('');
  const dataPts=rv.map((v,i)=>pxy(i,rad*v/100).map(x=>x.toFixed(1)).join(',')).join(' ');
  const rl=labels.map((l,i)=>{const [x,y]=pxy(i,rad+14);return `<text x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="var(--ink2)">${l}</text>`;}).join('');
  const rvTxt=rv.map((v,i)=>{const [x,y]=pxy(i,rad*v/100);return `<text x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--gold)" font-weight="bold">${v}</text>`;}).join('');
  html+=`<div style="background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:10px"><div style="font-size:.8rem;color:var(--gold);margin-bottom:2px">📊 命局五维量化</div><svg viewBox="0 0 ${cw} ${chh}" style="width:100%;max-width:280px;display:block;margin:4px auto 0">${grid}<polygon points="${dataPts}" fill="rgba(176,138,62,.18)" stroke="var(--gold)" stroke-width="1.5"/>${rl}${rvTxt}</svg><div style="text-align:center;font-size:.66rem;color:var(--ink3);margin-top:2px">五项量化值(0-100) · 命理潜力区间</div></div>`;
  // 评分依据弹窗按钮(用dataset安全传参,避免onclick属性嵌套反引号模板字符串导致HTML解析断裂)
  const basisHtml=(d.basis||[]).map(b=>`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed var(--line);font-size:.74rem"><span style="color:var(--ink2)">${b.k}</span><b style="color:var(--gold)">${b.v>0?'+':''}${b.v}</b></div>`).join('');
  html+=`<div style="text-align:right;margin-top:8px"><button type="button" class="btn btn-ghost basis-btn" data-basis="${encodeURIComponent(basisHtml)}" data-total="${d.score}" style="font-size:.7rem;padding:4px 10px">🧮 评分依据</button></div>`;
  html+=`<div style="margin-top:4px;font-size:.76rem;color:var(--ink2);line-height:1.8">${d.note}<br><span style="color:var(--ink3);font-size:.7rem">※ 定档为命理潜力区间（非绝对值），实际由个人努力、时代机遇与行运共同决定；下限守得住，上限靠本事。</span></div>`;
  return '<div class="mingge-reference">'+mingGeSummaryBody(zh)+'</div><details><summary>展开旧规则演示（未校准）</summary>'+html+'</details>';
}
/* 评分依据弹窗(读button.dataset,避免onclick属性嵌套) */
function aiShowBasis(basisHtml,total){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  ov.onclick=e=>{if(e.target===ov)document.body.removeChild(ov);};
  ov.innerHTML=`<div style="background:var(--card);border:1px solid var(--gold2);border-radius:14px;padding:20px;width:min(420px,92vw);max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)"><h4 style="margin:0 0 10px;color:var(--gold);font-size:.95rem">🧮 命局定分评分依据</h4><div style="font-size:.72rem;color:var(--ink3);margin-bottom:8px">综合定档评分体系（${total}分 / 100）</div>${basisHtml}<div style="margin-top:10px;font-size:.7rem;color:var(--ink3);line-height:1.6">评分项均来自命局排盘数据（得令/用神力量/通根/官杀有制/财官印流通/格局清纯/调候/五行流通/冲刑扣分）。为命理潜力评估，非现实承诺。</div><div style="text-align:right;margin-top:10px"><button class="btn btn-ghost" onclick="this.closest('div[style*=\\"position:fixed\\"]').remove()" style="font-size:.75rem">关闭</button></div></div>`;
  document.body.appendChild(ov);
}
/* AI评分替换已移除；传统解释不得覆盖计算值。 */

/* 评分依据按钮事件委托 */
document.addEventListener('click',function(e){
  const b=e.target.closest('.basis-btn');
  if(b) aiShowBasis(decodeURIComponent(b.dataset.basis),b.dataset.total);
});
/* ============ 术语即点即译 ============ */
/* 渲染工具: 术语名包成可点击 span(有词条才包, 无则原文) */
function tterm(name){
  const n=String(name||'').trim();
  if(!n) return '';
  if(KB_TERMS[n]) return `<span class="tterm" data-term="${n}">${n}</span>`;
  return n;
}
/* 弹窗: 显示术语释义 */
function termTip(name){
  const entry=termKnowledge(name);if(!entry)return;
  const previous=document.activeElement;
  const t={w:entry.category,d:entry.explanation};
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  const dismiss=()=>{ov.remove();previous?.focus();};
  ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',name+'释义');
  ov.onclick=e=>{if(e.target===ov)dismiss();};
  const catColor={十神:'var(--gold)',神煞:'var(--jade)',运程:'var(--purple)',地支关系:'var(--orange)',格局:'var(--red)',五行:'var(--blue)',基础:'var(--gold2)'};
  const col=catColor[t.w]||'var(--gold)';
  ov.innerHTML=`<div style="background:var(--card);border:1px solid ${col};border-radius:14px;padding:20px 22px;width:min(430px,92vw);max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <span style="font-family:'Noto Serif SC',serif;font-size:1.15rem;font-weight:800;color:${col}">${name}</span>
      <span style="font-size:.66rem;color:#fff;background:${col};border-radius:8px;padding:2px 8px">${t.w}</span>
    </div>
    <div style="font-size:.82rem;color:var(--ink);line-height:1.9">${mingGeEscape(t.d)}</div>${VERIFIED_TERM_NOTES[name]?readingCitations(VERIFIED_TERM_NOTES[name].keys):'<small>出处待核验</small>'}
    <div style="text-align:right;margin-top:14px"><button class="btn btn-ghost term-close" style="font-size:.75rem;padding:5px 14px">关闭</button></div>
  </div>`;
  document.body.appendChild(ov);
  const close=ov.querySelector('.term-close');
  if(close){close.onclick=dismiss;close.focus();}
  ov.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();dismiss();}
    if(e.key==='Tab'){const items=[...ov.querySelectorAll('button,a[href],summary')].filter(n=>n.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
}
/* 术语点击事件委托(含动态渲染的内容) */
document.addEventListener('click',function(e){
  const t=e.target.closest('.tterm');
  if(t&&KB_TERMS[t.dataset.term]) termTip(t.dataset.term);
});
/* ======================== 18 维报告本地引擎（新增维度） ======================== */
// ① 旺衰平衡
function zhWangShuai(zh){
  const ls=zhLiuShen(zh);
  let s=`日主${GAN[zh.dg]}${WUXING[GAN_WX[zh.dg]]}，五行能量：${zh.wxCount.map((c,i)=>WUXING[i]+c).join('、')}。`;
  s+=`判定为「${zh.strengthType}」（评分${zh.strengthScore.toFixed(1)}）。`;
  if(zh.congGe) s+=`弃命从势，顺势而为最吉。`;
  else if(zh.strong) s+=`日主偏旺，宜克泄耗（${WUXING[(GAN_WX[zh.dg]+2)%5]}财/${WUXING[(GAN_WX[zh.dg]+3)%5]}官/${WUXING[(GAN_WX[zh.dg]+1)%5]}食伤）以平衡；忌印比帮扶。`;
  else if(strengthLabel(zh)==='中和') s+=`日主中和，不预设身弱喜生扶，结合格局与调候判断。`;
  else s+=`日主偏弱，宜印比生扶；忌财官食伤耗身。`;
  s+=`喜用神${WUXING[ls.yong]}（${ls.roles.yong}），喜神${WUXING[ls.xi]}。`;
  s+=`注意：身强弱只是能量倾向，不绝对等于吉凶——身强能任财官、身弱喜借势，结合组合看全局。`;
  return s;
}
// ③ 穷通调候
function zhTiaoHou(zh){
  const mz=zh.monthGZ[1];
  const isCold=[11,0,1].includes(mz), isHot=[5,6,7].includes(mz);
  let s=`生于${ZHI[mz]}月（${['冬','冬','冬','春','春','夏','夏','夏','秋','秋','秋','冬'][mz]}季），命局${isCold?'偏寒，气机凝滞，宜火暖局':isHot?'偏燥，气机亢热，宜水润局':'寒暖适中，燥湿中和，调候之需不强'}。`;
  if(zh.tiaoHouWX>=0) s+=`调候用神宜取${WUXING[zh.tiaoHouWX]}：${zh.tiaoHouWX===1?'冬生用丙火暖局，如寒炉添薪，气得其暖而后生机发':'夏生用壬癸水润局，如旱田得雨，燥气得润而后万物生'}。`;
  else s+=`生于中和之季，调候之需不强，以扶抑用神为主。`;
  if(zh.tiaoHouPlaceNote) s+=`📍 出生地调候修正：${zh.tiaoHouPlaceNote}。`;
  const hot=zh.wxCount[1], cold=zh.wxCount[4];
  s+=`命局火${hot}分、水${cold}分，${hot>cold?'火盛水弱，宜补水润燥':'水盛火弱，宜补火暖局'}。`;
  s+=`（此为《穷通宝鉴》传统调候观点，供参考。）`;
  return s;
}
// ⑤ 神煞辅助
function zhShenShaZhu(zh){
  const list=typeof zhShenShaQuan==='function'?zhShenShaQuan(zh):[];
  if(!list.length) return '命局神煞不显，以十神格局为主论。';
  const modern={天乙贵人:'贵人相助、逢凶化吉，宜善结人脉',文昌贵人:'利学习考试、文书表达',太极贵人:'喜钻研哲学、玄学、艺术',驿马:'变动出行、外地发展机会',桃花:'人际魅力、感情机会',华盖:'独立思考、宗教哲学、艺术灵感',天德:'心地仁厚、常遇德助',月德:'贵人扶持、平安顺遂',将星:'领导统御、主事之才',亡神:'宜守机密、防口舌',劫煞:'防财物破耗、宜谨慎',孤辰寡宿:'内心世界丰富、宜自得其乐'};
  let s='神煞为辅助参考，不作主断：\n';
  list.forEach(x=>{
    const m=modern[x.name]||'辅助参考';
    s+=`· ${tterm(x.name)}（${x.where}）：${m}；\n`;
  });
  s+='神煞只揭示倾向，不预言吉凶——贵人也需自身实力接得住，桃花也需主动经营才成良缘。';
  return s;
}
// ⑥ 纳音意象
const NAYIN_XIANG={
  '海中金':'如深海藏金，志存高远、厚积薄发','炉中火':'如熔炉之火，热情刚烈、炼就真金','大林木':'如参天林木，正直向上、荫庇一方','路旁土':'如路边沃土，务实安稳、成就他人','剑锋金':'如利剑出鞘，刚毅果决、锋芒毕露','山头火':'如山巅之火，光明磊落、气势不凡','涧下水':'如山涧清泉，灵动聪慧、润物无声','城墙土':'如城墙厚土，稳重可靠、护卫一方','白蜡金':'如烛泪金银，精致内敛、细水长流','杨柳木':'如杨柳拂水，柔韧婉转、随遇而安','井泉水':'如深井甘泉，滋养内在、不争而胜','屋上土':'如屋瓦之土，安家立业、遮风挡雨','霹雳火':'如惊雷烈火，爆发力强、行事迅捷','松柏木':'如松柏常青，坚韧耐寒、晚景常好','长流水':'如长河奔流，绵绵不绝、通达四方','沙中金':'如沙中淘金，历经磨砺、终见真金','山下火':'如篝火温照，温暖亲切、聚人心气','平地木':'如平原草木，谦和包容、生生不息','壁上土':'如墙泥之土，调和环境、默默奉献','金箔金':'如金箔装点，注重仪表、气质典雅','覆灯火':'如灯烛之光，指引人心、照亮他人','天河水':'如天河之水，高远智慧、泽被苍生','大驿土':'如驿道之土，奔波通达、行旅四方','钗钏金':'如首饰金银，精致贵气、重情重义','桑柘木':'如桑柘之木，实用朴实、滋养蚕桑','大溪水':'如溪流奔腾，活泼进取、生机盎然','沙中土':'如沙中之土，散而能聚、包容万物','天上火':'如日月之光，高瞻远瞩、光明正大','石榴木':'如石榴结实，多子多福、成果丰硕','大海水':'如大海之水，胸襟开阔、容纳百川'};
function zhNaYinXiang(zh){
  const yearNy=NAYIN[nayinIndex(zh.yearGZ[0],zh.yearGZ[1])];
  const dayNy=NAYIN[nayinIndex(zh.dayGZ[0],zh.dayGZ[1])];
  const yi=NAYIN_XIANG[yearNy]||'', di=NAYIN_XIANG[dayNy]||'';
  return `年柱纳音「${yearNy}」：${yi}——为命之根基、家族基调。\n日柱纳音「${dayNy}」：${di}——为本人之质感、内在气质。\n纳音为传统命理的文化意象（《三命通会》体系），观其神韵、不执其兆。`;
}
// ⑭ 大运总览
function zhDaYunZongLan(zh){
  const now=new Date().getFullYear(), birth=zh.date.getFullYear();
  let s=`${zh.dy.startAge}岁起运（${zh.dy.forward?'顺行':'逆行'}），共${zh.dy.dyList.length}步大运，每步十年。\n`;
  zh.dy.dyList.forEach((dy,i)=>{
    const tg=tenGod(zh.dg,dy.g);
    const cs=getChangSheng(zh.dg,dy.z);
    const active=birth+dy.age<=now&&now<=birth+dy.endAge;
    s+=`${i+1}. ${GAN[dy.g]}${ZHI[dy.z]}（${SHISHEN_NAME[tg]}·${cs}运，${dy.age}-${dy.endAge}岁）${active?' ← 当前大运':''}${dy.nayin?'【'+dy.nayin+'】':''}；\n`;
  });
  const cur=zh.dy.dyList.find(dy=>birth+dy.age<=now&&now<=birth+dy.endAge);
  if(cur){
    const next=zh.dy.dyList[zh.dy.dyList.indexOf(cur)+1];
    s+=`当前行${SHISHEN_NAME[tenGod(zh.dg,cur.g)]}运（${GAN[cur.g]}${ZHI[cur.z]}），${next?`下一步${GAN[next.g]}${ZHI[next.z]}（${SHISHEN_NAME[tenGod(zh.dg,next.g)]}运）`:''}。`;
    s+=`大运十年一轮，喜用神大运宜进取布局，忌神大运宜守成蓄力。`;
  }
  return s;
}
// ⑱ 风险提示
function zhFengXian(zh){
  const risks=[];
  const rels=typeof zhGanZhiMap==='function'?zhGanZhiMap(zh):[];
  const chong=rels.filter(r=>r.cls==='chong').length, xing=rels.filter(r=>r.cls==='xing').length;
  if(chong>=2) risks.push(`命局${chong}处相冲，人事变动较频，决策宜留缓冲、重大事项多复核`);
  if(xing>=2) risks.push(`命局${xing}处相刑，易生口舌是非，涉合同文书需谨慎落笔`);
  if(strengthLabel(zh)==='身弱') risks.push(`日主偏弱而财官重，压力承受面有限，忌高杠杆、忌透支体力硬扛`);
  if(zh.strong&&zh.tsCount[6]+zh.tsCount[7]>=2) risks.push(`身强官杀重，性格刚直，易与权威冲突，宜以柔克刚`);
  if(zh.caiPian>=3) risks.push(`偏财多现，来财快但波动大，忌投机重仓、宜见好即收`);
  if(zh.tsCount[2]+zh.tsCount[3]>=3) risks.push(`食伤过旺，才华外露易招妒，忌锋芒过露、谨言慎行`);
  if(risks.length===0) risks.push('命局组合较平顺，主要风险在于行运起伏，逢忌神大运宜守成');
  let s=risks.join('；\n')+'。\n';
  s+='本提示为命理文化参考：健康问题请咨询医生，投资决策请理性评估，婚姻选择请尊重现实——命理指倾向，不指命运。';
  return s;
}
function zhJianYi(zh){
  const yw=zh.yongShen;
  const dir=['东方','南方','中央','西方','北方'][yw];
  const color=['青绿','赤红','黄褐','白金银','玄黑'][yw];
  let s=`开运之法，贵在顺用神、调气场。此造喜用${WUXING[yw]}，${WX_INDUSTRY[yw]}。`;
  if(zh.tiaoHouWX>=0){
    const isCold=zh.tiaoHouWX===1;
    s+=`且生于${isCold?'亥子丑月，冬令偏寒':'巳午未月，夏令偏燥'}，调候宜${WUXING[zh.tiaoHouWX]}（${isCold?'火暖局':'水润局'}），寒暖得宜则气机通畅、诸事顺遂。`;
  }
  s+=`方位宜${dir}，办公家居多向${dir}；色调宜${color}，衣着器物可从此色；佩${['绿松石·翡翠','红玛瑙·石榴石','黄水晶·蜜蜡','白水晶·金银','黑曜石·海蓝宝'][yw]}随身助运。`;
  s+=zh.congGe?`从格之命，顺势而为最吉，逆势强求反招祸，宜借势不逆势；`:(strengthText(zh,`身强（${zh.strengthType}）气盛，宜多行克泄耗之事，忙中求进、闲则生非，事业宜主动开拓；`,`身弱（${zh.strengthType}），宜印比帮扶，多亲近贵人长辈，借势而行、择善而从；`));
  s+=`择业、择偶、择居皆可向${WUXING[yw]}倾斜；流年逢${WUXING[yw]}旺之岁运，运势上扬，宜顺势而为、大胆布局，忌逆势硬撑。`;
  return s;
}
// 命局格局(月令取格)
function zhGeJu(zh){
  const s=buildMingGeSummary(zh);
  return '<p>'+mingGeEscape(s.headline)+'</p><p>本气'+mingGeEscape(s.month.gan)+'为'+mingGeEscape(s.month.god)+'；'+s.month.candidates.map(n=>mingGeEscape(GAN[n.gan])+'·'+mingGeEscape(SHISHEN_NAME[n.god])+'（'+(n.exposed?'透干':'藏支')+'）').join('、')+'。</p><p>'+s.paths.map(p=>mingGeEscape(p.title)+'：'+mingGeEscape(p.state)).join('；')+(s.obstacles.length?'。关节：'+s.obstacles.map(o=>mingGeEscape(o.title)+'·'+mingGeEscape(o.resolution)).join('；'):'')+'</p>'+readingCitations(['pattern','rescue']);
}
// 六亲缘分
function zhLiuQin(zh){
  const fu=zh.tsCount[4], mu=zh.tsCount[9];
  const xiong=zh.tsCount[0]+zh.tsCount[1];
  const zi=zh.gender===1?(zh.tsCount[6]+zh.tsCount[7]):(zh.tsCount[2]+zh.tsCount[3]);
  let s='六亲缘分，以十神配六亲观之：';
  s+=`偏财${fu}位为父，${fu>=2?'父星有力，得父辈荫助，家业有继，父缘深厚':fu===0?'父星不显于局，缘分偏淡，或聚少离多，自立为强，反主自强不息':'父缘平顺，相处相安'}；`;
  s+=`正印${mu}位为母，${mu>=2?'母星得地，母慈仁厚，多有学识涵养之家风，得母荫最深':mu===0?'母缘浅淡，主亲力亲为、早熟自立':'母缘平和，敬顺即安'}；`;
  s+=`比劫${xiong}位为兄弟姐妹，${xiong>=3?'比劫重，兄弟朋友众多而竞争亦多，手足各自成家':'比劫少，同辈助力寡，凡事多靠自己，反得清静自在'}；`;
  s+=`子女星${zi}位（男以官杀、女以食伤论），${zi>=2?'子女缘旺，晚年得子女之福，承欢膝下':zi===0?'子女缘迟或淡，宜顺其自然，莫强求，有子亦聚少离多':'子女缘中平，教养得法则成才'}。`;
  s+='六亲之缘，有深有浅，皆是宿命安排，惜缘而不攀缘，方是处世之道。';
  // 盲派六亲论(宫位为体星为用)
  const yzhi=zh.yearGZ[1], mzhi=zh.monthGZ[1];
  const yHidden=ZHI_HIDDEN[yzhi], mHidden=ZHI_HIDDEN[mzhi];
  const brokenY=zhGanZhiMap(zh).filter(r=>r.cls==='chong'||r.cls==='xing'||r.cls==='hai').some(r=>r.from&&r.from.includes('年'));
  const brokenM=zhGanZhiMap(zh).filter(r=>r.cls==='chong'||r.cls==='xing'||r.cls==='hai').some(r=>r.from&&r.from.includes('月'));
  s+=`盲派另论：父母以年月宫位为体、星为用，${brokenY?'年宫逢冲刑害，祖上根基有损，祖业荫庇弱':'年宫安稳，祖业有根'}；${brokenM?'月宫逢冲刑害，父母宫位有损，双亲多劳或聚少离多':'月宫安稳，父母安康'}。母星亦可参以禄、食伤、比劫论之（与正印为母并参）。`;
  return s;
}
// 人际贵人
function zhRenJi(zh){
  let s='';
  const tianyi=tianyiGan(zh.dg);
  const hasTY=[zh.yearGZ[1],zh.monthGZ[1],zh.dayGZ[1],zh.hourGZ[1]].some(z=>tianyi.includes(z));
  s+=hasTY?`天乙贵人在命（${tianyi.map(z=>ZHI[z]).join('、')}），危难多有人助，一生贵人缘佳，逢凶化吉，遇险有解。`:`天乙不现于四柱，贵人多为间接之助，遇事宜主动结缘、广种善因，以诚感人则贵人自来。`;
  const bi=zh.tsCount[0]+zh.tsCount[1];
  s+=bi>=2?`比劫旺，同辈朋友众多，热闹非常，然防合作分利、劫财之患，共事须明算账，亲兄弟亦分明。`:`比劫平和，人脉圈较清净，朋友贵精不贵多，宜深耕高质量之交。`;
  const sha=zh.tsCount[6];
  if(sha>=2) s+=`七杀旺而身弱，易感上级与规则压力，宜韬光养晦、以印化杀，待时而动；`;
  else if(zh.tsCount[7]>=2) s+=`正官透旺，为人正派守矩，得领导赏识，仕途人际多顺，贵人在上；`;
  else s+=`官杀有度，处世进退有据，能担事而不惹事，人际四平八稳。`;
  s+=`人脉即财脉，命局比劫财星配置已定贵人之象，主动经营，自得助力。`;
  return s;
}
// 流年大运走势
function zhLiuNianDetail(zh){
  const nowYear=new Date().getFullYear();
  const ni=((nowYear-4)%60+60)%60; const [cg,cz]=indexToGZ(ni);
  const ctg=tenGod(zh.dg,cg);
  const wxTxt=GAN_WX[cg]===zh.yongShen||ZHI_WX[cz]===zh.yongShen?'值喜用，运势顺遂':'非喜用，宜守正蓄力';
  const zzC=ZHI_HIDDEN[cz]?ZHI_HIDDEN[cz][0]:-1;
  const tzC=zzC>=0?tenGod(zh.dg,zzC):-1;
  let s=`行运有节，知时而动。当前${nowYear}年（${GAN[cg]}${ZHI[cz]}年，干${SHISHEN_NAME[ctg]}${tzC>=0?'·支'+SHISHEN_NAME[tzC]:''}流年，${wxTxt}）。`;
  s+='未来三年走势：';
  for(let i=1;i<=3;i++){
    const yy=nowYear+i;
    const idx=((yy-4)%60+60)%60;
    const [g,z]=indexToGZ(idx);
    const tg=tenGod(zh.dg,g);
    const zz=ZHI_HIDDEN[z]?ZHI_HIDDEN[z][0]:-1;
    const tz=zz>=0?tenGod(zh.dg,zz):-1;
    const isGood=GAN_WX[g]===zh.yongShen||ZHI_WX[z]===zh.yongShen;
    s+=`${yy}年${GAN[g]}${ZHI[z]}（干${SHISHEN_NAME[tg]}·支${tz>=0?SHISHEN_NAME[tz]:''}，${isGood?'喜用之年，可进':'平顺之年，宜守'}）；`;
  }
  const d0=zh.dy.dyList[0];
  const d0g=tenGod(zh.dg,d0.g);
  const d1=zh.dy.dyList[1];
  const d1g=tenGod(zh.dg,d1.g);
  const d0good=(zh.strong&&[2,3,4,5,6,7].includes(d0g))||(!zh.strong&&[0,1,8,9].includes(d0g));
  const d1good=(zh.strong&&[2,3,4,5,6,7].includes(d1g))||(!zh.strong&&[0,1,8,9].includes(d1g));
  s+=`大运十年一轮：${zh.dy.startAge}岁起运，首运${GAN[d0.g]}${ZHI[d0.z]}（${SHISHEN_NAME[d0g]}运）${d0good?'为喜用，根基顺遂、宜打基础':'(印比或克泄耗)，平稳蓄力、宜学宜练'}；`;
  s+=`次运${GAN[d1.g]}${ZHI[d1.z]}（${SHISHEN_NAME[d1g]}运）${d1good?'渐入佳境，事业财运上扬，宜提前布局、大胆落地':'转折调整之运，宜稳中求变'}。`;
  s+='运势如潮，有起有落，喜用之年进、忌神之年守，顺势者昌。';
  // 盲派应期法
  const rels=zhGanZhiMap(zh);
  const chongY=rels.filter(r=>r.cls==='chong').map(r=>r.name.slice(0,2));
  const heY=rels.filter(r=>r.cls==='he'||r.cls==='sanhe').map(r=>r.name.slice(0,2));
  s+='盲派论应期：流年只管应期、不管吉凶，吉凶由原局与大运定；';
  if(chongY.length) s+=`命局带${chongY.join('、')}之冲，逢大运流年再引此冲（或冲开墓库）之年，即为应事之期，多主变动、迁居、开合；`;
  if(heY.length) s+=`带${heY.join('、')}之合，逢合、拱、会之年为聚合应期，多主合作、婚嫁、成事；`;
  s+='逢岁运引动原局字（禄、原身、藏干现出），亦为应期之象。';
  return s;
}
// 方位宜忌
function zhFangWei(zh){
  const gua=getMingGua(zh.date.getFullYear(),zh.gender);
  const isEast=['坎卦','离卦','震卦','巽卦'].includes(gua);
  let s=`宅命相配，气聚人和。八宅命卦为${gua}，属${isEast?'东四命':'西四命'}。`;
  s+=isEast?`吉位：东南（生气·最旺财）、正东（天医·利健康）、正南（延年·利婚姻），宜朝向东南或正东；凶位西北（五鬼）宜设为储物静区，勿作主卧书房。`:`吉位：西南（生气·最旺财）、西北（天医·利健康）、正西（延年·利婚姻），宜朝向西南或西北；凶位正东（五鬼）宜化解。`;
  s+=`床头宜坐吉向吉，书桌背有靠而面向吉方，大门忌直冲凶位，厨房厕所宜压凶方。`;
  s+=`再合喜用神${WUXING[zh.yongShen]}：日常求财求事宜向${['东方','南方','中央','西方','北方'][zh.yongShen]}，佩${['青绿','赤红','黄褐','白金银','玄黑'][zh.yongShen]}之饰助运，二法相参，其应愈灵。`;
  return s;
}
// 六神配置: 用神/喜神/忌神/仇神/闲神(子平扶抑法)
// 六神配置: 用神/喜神/忌神/仇神/闲神（敌我阵营学·以日主为中心）
// 用神=救主最有力(主帅); 喜神=帮身助用(援军); 忌神=克身破坏(敌军); 仇神=生忌送粮(粮草); 闲神=中立(路人)
// 五行关系: 生我(印+4) 我同(比0) 我生(食伤+1) 我克(财+2) 克我(官杀+3)
function zhLiuShen(zh){
  const dw=GAN_WX[zh.dg]; // 日主五行
  const y=zh.yongShen;    // 用神
  const shengWo=(dw+4)%5; // 印
  const woSheng=(dw+1)%5; // 食伤
  const woKe=(dw+2)%5;    // 财
  const keWo=(dw+3)%5;    // 官杀
  let xi,ji,chou,note;
  if(zh.congGe){
    xi=(y+4)%5; ji=dw; chou=(dw+4)%5; note='从格·弃命从势';
  }else if(zh.strong){
    xi=(y+4)%5;
    ji=(zh.wxCount[dw]>=zh.wxCount[shengWo])?dw:shengWo;
    chou=(ji+4)%5; note='身强宜抑·印比为忌';
  }else if(strengthLabel(zh)==='中和'){
    xi=(y+4)%5;ji=(y+3)%5;chou=(ji+4)%5;note='中和·围绕暂取用神论生克，非身弱扶身';
  }else{
    xi=(y===dw)?shengWo:dw; ji=keWo; chou=woKe; note='身弱宜扶·官杀为忌';
  }
  // 去重: 4 神互异(任一重复则从未用五行找替补, 兜底保证不undefined)
  const used=new Set([y]);
  const nextFree=()=>[0,1,2,3,4].find(w=>!used.has(w));
  if(used.has(xi)||xi==null||xi==undefined){ xi=nextFree(); used.add(xi); }else used.add(xi);
  if(used.has(ji)||ji==null||ji==undefined){ ji=nextFree(); used.add(ji); }else used.add(ji);
  if(used.has(chou)||chou==null||chou==undefined){ chou=nextFree(); used.add(chou); }else used.add(chou);
  const xian=[0,1,2,3,4].filter(w=>!used.has(w));
  const count=w=>zh.wxCount[w];
  // 阵营角色文案: 按日主强弱+实际五行动态生成(不再笼统"印比",而是"印"+具体五行)
  // 防御: w() 兜底 undefined,确保角色文案不出现字面量"undefined"
  const w=w=>{const v=WUXING[w]; return v===undefined?'—':v;};
  let roles;
  if(zh.congGe){
    // 从格: 喜=生助所从(yong), 忌=印比破从, 仇=生印比
    roles={
      yong:`主帅·从势为${w(y)}（弃命依之）`,
      xi:`援军·生助${w(y)}之${w(xi==dw?dw:xi)}`,
      ji:`敌军·印比${w(ji)}破从`,
      chou:`粮草·${w(chou)}生印比`,
      xian:`路人·随运而转`
    };
  }else if(zh.strong){
    // 身强: 用=克泄耗, 喜=生用神, 忌=印比中最旺, 仇=生忌
    roles={
      yong:`主帅·${w(y)}克泄耗·治病之药`,
      xi:`援军·${w(xi)}生${w(y)}·助用药力`,
      ji:`敌军·${w(ji)}${ji===dw?'比劫':ji===(dw+4)%5?'印':''}帮身过旺`,
      chou:`粮草·${w(chou)}生${w(ji)}·给忌送粮`,
      xian:`路人·随运而转`
    };
  }else if(strengthLabel(zh)==='中和'){
    roles={yong:`中和·暂取${w(y)}，结合格局调候复核`,xi:`参考·${w(xi)}生用`,ji:`参考·${w(ji)}克用`,chou:`参考·${w(chou)}生克`,xian:'随格局与行运判断'};
  }else{
    // 身弱: 用=印比, 喜=另一印或比, 忌=官杀, 仇=财
    const isYongYin=y===(dw+4)%5;
    const isYongBi=y===dw;
    roles={
      yong:`主帅·${w(y)}${isYongYin?'印':isYongBi?'比劫':''}·救身之药`,
      xi:`援军·${w(xi)}${xi===dw?'比劫帮身':xi===(dw+4)%5?'印助身':'帮身'}·助用`,
      ji:`敌军·${w(ji)}${ji===(dw+3)%5?'官杀':''}克身`,
      chou:`粮草·${w(chou)}${chou===(dw+2)%5?'财星':''}生${w(ji)}资敌`,
      xian:`路人·${w(xian[0]||0)}随运而转`
    };
  }
  return {yong:y,xi,ji,chou,xian,count,strong:zh.strengthType,cong:zh.congGe,note,roles};
}
// 藏干十神+比例(本气6成/中气3成/余气1成,双藏干7/3,单藏干全)
function zhiHiddenTs(zh,dgzhi){
  const hidden=ZHI_HIDDEN[dgzhi];
  const ratios=hidden.length===3?[60,30,10]:hidden.length===2?[70,30]:[100];
  return hidden.map((g,i)=>{
    const ts=SHISHEN_NAME[tenGod(zh.dg??zh.dayGan,g)];
    return {g,ts,r:ratios[i],isMain:i===0};
  });
}
// 人元司令分野(月令司令之神,子平取格与旺衰的重要依据)
// 格式: 地支 -> [天干索引, 司令天数] 数组; 12支各30日, 本气多日/中气7日/余气7日(申月特殊含3神)
// 天干索引: 0甲1乙2丙3丁4戊5己6庚7辛8壬9癸
const SI_LING={
  0:[[8,10],[9,20]],                // 子: 壬10 癸20
  1:[[9,9],[7,3],[5,18]],           // 丑: 癸9 辛3 己18
  2:[[4,7],[2,7],[0,16]],           // 寅: 戊7 丙7 甲16
  3:[[0,10],[1,20]],                // 卯: 甲10 乙20
  4:[[1,9],[9,3],[4,18]],           // 辰: 乙9 癸3 戊18
  5:[[4,7],[6,7],[2,16]],           // 巳: 戊7 庚7 丙16
  6:[[2,10],[5,9],[3,11]],          // 午: 丙10 己9 丁11
  7:[[3,9],[1,3],[5,18]],           // 未: 丁9 乙3 己18
  8:[[5,7],[4,3],[6,17],[8,3]],     // 申: 己7 戊3 庚17 壬3
  9:[[6,10],[7,20]],                // 酉: 庚10 辛20
  10:[[7,9],[3,3],[4,18]],          // 戌: 辛9 丁3 戊18
  11:[[4,7],[0,5],[8,18]]           // 亥: 戊7 甲5 壬18
};
// 计算出生日距月令"节"第几天, 返回当前司令之神(天干索引)
function siLingInfo(date,mz){
  try{
    const jieIdx=[0,2,4,6,8,10,12,14,16,18,20,22][mz]; // 月支对应之节(小寒/立春/惊蛰...)
    const jm=(mz-1+12)%12; // 节所在公历月: 寅->1(2月) 卯->2(3月)... 子->11(12月) 丑->0(1月)
    const jd=solarTermDay(date.getFullYear(),jieIdx);
    const jDate=new Date(date.getFullYear(),jm,jd);
    const pass=Math.round((date-jDate)/86400000)+1; // 节后第几天(1起)
    const list=SI_LING[mz];
    let acc=0,cur=list[0][0],curIdx=0;
    for(let i=0;i<list.length;i++){
      acc+=list[i][1];
      if(pass<=acc){cur=list[i][0];curIdx=i;break;}
      cur=list[i][0];curIdx=i;
    }
    return {pass,cur,curIdx,list,total:list.reduce((a,x)=>a+x[1],0)};
  }catch(e){return null;}
}
// 五行流通分析
function zhTongGuan(zh){
  const wx=zh.wxCount, dw=GAN_WX[zh.dg];
  const sw=wx[(dw+4)%5], xs=wx[(dw+1)%5], kc=wx[(dw+2)%5], kw=wx[(dw+3)%5];
  let s=`五行流通，贵在生气不断。日主${WUXING[dw]}，印星（${WUXING[(dw+4)%5]}）${sw}、比劫（${WUXING[dw]}）${wx[dw]}、食伤（${WUXING[(dw+1)%5]}）${xs}、财星（${WUXING[(dw+2)%5]}）${kc}、官杀（${WUXING[(dw+3)%5]}）${kw}。`;
  const chain=[];
  if(sw>=1) chain.push(`印生身（${WUXING[(dw+4)%5]}生${WUXING[dw]}）有情`);
  if(xs>=1&&kc>=1) chain.push(`食伤生财（${WUXING[(dw+1)%5]}生${WUXING[(dw+2)%5]}）流通成财`);
  else if(xs>=1) chain.push(`食伤泄秀而无财承接，秀气宜有财官收束`);
  if(kc>=1&&kw>=1) chain.push(`财生官（${WUXING[(dw+2)%5]}生${WUXING[(dw+3)%5]}）贵气流通`);
  if(kw>=1&&sw>=1) chain.push(`官印相生（${WUXING[(dw+3)%5]}生${WUXING[(dw+4)%5]}）情义两全`);
  const maxWx=wx.indexOf(Math.max(...wx)), minWx=wx.indexOf(Math.min(...wx));
  s+=chain.length?`流通要点：${chain.join('；')}。`:`命局流通不畅，五行各安其位而未成环，须行运引动通关之神。`;
  if(wx[maxWx]>=3&&wx[(maxWx+2)%5]===0) s+=`${WUXING[maxWx]}气盛而${WUXING[(maxWx+2)%5]}气绝，两行对峙，宜以${WUXING[(maxWx+1)%5]}通关调候，转战为和。`;
  // 十神相克组合取象(王家荣: 六种组合吉凶取向)
  const ts=zh.tsCount;
  const combos=[];
  if(ts[0]+ts[1]>0&&ts[4]+ts[5]>0) combos.push(`比劫克财：防合伙分财、兄弟夺利，然比劫制财得宜反主能控财局`);
  if(ts[4]+ts[5]>0&&ts[8]+ts[9]>0) combos.push(`财克印：主为财损学、利欲分心，印强财弱则无碍，财印两停反主富贵双全`);
  if(ts[8]+ts[9]>0&&ts[2]+ts[3]>0) combos.push(`印克食伤：枭神夺食之象，才华受抑，见财制印则解`);
  if(ts[2]+ts[3]>0&&ts[6]+ts[7]>0) combos.push(`食伤克官杀：伤官见官，防是非官非，身强食伤有制反主掌权驭下`);
  if(ts[6]+ts[7]>0&&ts[0]+ts[1]>0) combos.push(`官杀克比劫：竞争压力加身，有印化杀则贵，无制则劳`);
  if(combos.length) s+=`十神组合取象：${combos.join('；')}。`;
  s+=`五行流通则气顺，气顺则诸事顺遂；阻塞之处，即是行运与调候的着力点。`;
  return s;
}
// 五行流通环形图(圆大小=命局数量, 金色实线=相生, 红色虚线=相克)
function wxFlowSvg(zh){
  try{
    const names=['木','火','土','金','水'];
    const colors=['#2e8b57','#c0392b','#b8860b','#8a8d93','#2f6da8'];
    const counts=zh.wxCount;
    const cx=280,cy=150,R=92;
    const pos=names.map((_,i)=>{
      const a=(-90+i*72)*Math.PI/180;
      return {x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)};
    });
    const sheng=[[0,1],[1,2],[2,3],[3,4],[4,0]]; // 木→火→土→金→水→木
    const ke=[[0,2],[2,4],[4,1],[1,3],[3,0]];   // 木克土 土克水 水克火 火克金 金克木
    let s='';
    sheng.forEach(([a,b])=>{
      s+=`<line x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}" stroke="#b08a3e" stroke-width="1.6" opacity=".7"/>`;
    });
    ke.forEach(([a,b])=>{
      s+=`<line x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}" stroke="#9e2b25" stroke-width="1.2" stroke-dasharray="4,4" opacity=".5"/>`;
    });
    names.forEach((n,i)=>{
      const r=16+Math.min(counts[i],8)*4;
      const c=colors[i];
      s+=`<circle cx="${pos[i].x}" cy="${pos[i].y}" r="${r}" style="fill:${c};opacity:.15;stroke:${c};stroke-width:1.5"/><text x="${pos[i].x}" y="${pos[i].y-2}" text-anchor="middle" font-size="15" font-weight="700" style="fill:${c}">${n}</text><text x="${pos[i].x}" y="${pos[i].y+14}" text-anchor="middle" font-size="9.5" style="fill:var(--ink2)">${counts[i]}位</text>`;
    });
    s+=`<text x="60" y="282" font-size="9.5" fill="#b08a3e">— 相生</text><text x="160" y="282" font-size="9.5" fill="#9e2b25">- - 相克</text><text x="255" y="282" font-size="9.5" style="fill:var(--ink3)">圆大小 = 五行数量</text>`;
    return `<svg viewBox="0 0 560 296" style="width:100%;max-width:520px;display:block;margin:6px auto">${s}</svg>`;
  }catch(e){return '';}
}
// 合冲刑害取象字典(完整关系名直查)
const QX_ALL={
  '甲己合土':'中正之合，主诚实守信、情义相投，宜合作共赢','乙庚合金':'仁义之合，主刚柔相济、以义相交，利结盟共事',
  '丙辛合水':'威制之合，主聪明秀气、外亲内慎','丁壬合木':'亲近之合，主多情善感、情意绵长，防情债','戊癸合火':'无情之合，主貌合神离、先合后分，慎合伙',
  '子丑合土':'虽合而浊，主滞而不畅，谋事须防牵绊','寅亥合木':'破合，合中有暗伤，主外合内离，慎浅交','卯戌合火':'淫合，主多情善感，防桃花之扰',
  '辰酉合金':'正合最吉，主诚笃相合、合作有成','巳申合水':'刑合，合中带刑，主合而多磨，须防口舌','午未合土':'正合，主中正和合、亲情深厚',
  '申子辰合水':'智局，主聪慧善谋，聚智成事','亥卯未合木':'仁局，主仁慈宽厚，人缘聚和','寅午戌合火':'礼局，主热情明理，事业聚气','巳酉丑合金':'义局，主刚毅果决，团体凝聚',
  '子午相冲':'水火交战，主劳心费神、情绪起伏','丑未相冲':'土冲而动，主家宅变动、工作更迭','寅申相冲':'金木交战，主奔波劳碌、驿马之动',
  '卯酉相冲':'成败交争，主成败起伏、纠葛反复','辰戌相冲':'墓库冲开，主变革之机，财库冲开聚散皆宜','巳亥相冲':'水火冲激，主远行劳心、心思多变',
  '寅巳申三刑':'恃势之刑，主恃强凌弱，防官非是非','丑戌未三刑':'无恩之刑，主恩将仇报，防六亲刑伤','子卯相刑':'无礼之刑，主口舌是非，防失礼失德',
  '辰辰自刑':'自刑，主自寻烦恼、自我折磨','午午自刑':'自刑，主心高气傲、自视过高','酉酉自刑':'自刑，主固执己见、自伤自怜','亥亥自刑':'自刑，主多思多虑、自我设限',
  '甲庚相冲':'东西对冲，主远行变动、性格刚烈、防筋骨之伤','乙辛相冲':'主心思变动、言行反复、防口舌','丙壬相冲':'南北对冲，主劳心奔波、情绪起伏','丁癸相冲':'主暗耗忧烦、心绪不宁',
  '子未相害':'势家相害，主六亲不睦、防暗损','丑午相害':'官鬼相害，主多疑善感、防小人','寅巳相害':'临官相害，主防人暗算、慎出行',
  '卯辰相害':'少长相害，主骨肉不和、防口舌','申亥相害':'争进相害，主易生离析、慎合伙','酉戌相害':'妒害，主口舌妒忌、防是非',
  '子酉相破':'破败之象，主一生常遇经济困难、财帛难聚','午卯相破':'主多见纷争、感情为害，慎情债','寅亥相破':'破中带合，主优柔寡断、耳根软，易被说服',
  '巳申相破':'破中带刑，主模仿力强而拿不定主意、破耗加是非','辰丑相破':'主六亲难谐、男女多不睦','戌未相破':'主为人有城府、暗蓄机谋，财帛暗耗',
  '子戌暗合(癸戊合)':'暗合之象，主暗中交易、隐私之情，或明争暗合，须防暗箱之事','丑寅暗合(己甲合)':'暗合之象，主暗助暗合、暗中合作，得暗贵之助',
  '卯申暗合(乙庚合)':'暗合之象，主暗中结盟、隐情不宣，或财帛暗来','巳申暗合(丙辛合)':'暗合之象，巳申本合而带刑，主合中有波折，须防暗昧','午亥暗合(丁壬合)':'暗合之象，主暗昧情缘、情丝暗牵，防感情纠葛'
};
function zhHeChongXiang(zh){
  const rels=zhGanZhiMap(zh);
  if(!rels.length) return '命局四柱干支之间未见明显合冲刑害，气机平和，人事多顺遂少波折；逢大运流年引动之时，方有相应人事显现。';
  let s='';
  const counts={he:0,chong:0,sanhe:0,xing:0,hai:0,po:0,anhe:0};
  rels.forEach(r=>counts[r.cls]++);
  s+=`命局共见${rels.length}组合冲刑害关系（合${counts.he+counts.sanhe+counts.anhe}、冲${counts.chong}、刑${counts.xing}、害${counts.hai}、破${counts.po}、暗合${counts.anhe}）。`;
  rels.forEach(r=>{
    const baseName=r.name.replace(/（.*?）$/,''); // 去掉(半合)后缀
    const xiang=QX_ALL[baseName]||(r.cls==='he'?'主六合和合、亲近牵绊':r.cls==='sanhe'?'主三合成局、聚气得势':r.cls==='chong'?'主冲主动荡、变动迁移':r.cls==='xing'?'主刑伤是非、须谨言慎行':r.cls==='hai'?'主暗损不和、防小人':r.cls==='po'?'主破败损耗、宜守不宜进':'主干支互动');
    s+=`${baseName}（${r.from}${r.to?'与'+r.to:''}）：${xiang}；`;
  });
  if(counts.chong>0) s+=`命带${counts.chong}冲，主一生多变动迁移，逢冲之年宜守不宜进。`;
  if(counts.xing>0) s+=`带${counts.xing}刑，须谨言慎行，防是非官非。`;
  if(counts.hai>0) s+=`带${counts.hai}害，与人相处宜留余地，防暗损。`;
  if(counts.he+counts.sanhe>0) s+=`合多则人缘旺、合作吉，然合多亦主牵绊，宜择善而合。`;
  if(counts.po>0) s+=`带${counts.po}破，财帛往来宜慎，防暗中损耗。`;
  return s;
}
// ===== 神煞大全(标准查法) =====
const LU_SHEN={0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0}; // 十干禄: 甲寅乙卯丙巳丁午戊巳己午庚申辛酉壬亥癸子
const YANG_REN={0:3,1:2,2:6,3:5,4:6,5:5,6:9,7:8,8:0,9:11}; // 羊刃(帝旺): 甲卯乙寅丙午丁巳戊午己巳庚酉辛申壬子癸亥
const HONG_LUAN={0:3,1:2,2:1,3:0,4:11,5:10,6:9,7:8,8:7,9:6,10:5,11:4}; // 红鸾: 子卯丑寅寅丑卯子辰亥巳戌午酉未申申未酉午戌巳亥辰
const TIAN_XI={0:9,1:8,2:7,3:6,4:5,5:4,6:3,7:2,8:1,9:0,10:11,11:10}; // 天喜=红鸾对冲
const JIN_YU={0:4,1:5,2:7,3:8,4:7,5:8,6:10,7:11,8:1,9:2}; // 金舆: 甲辰乙巳丙戊未丁己申庚戌辛亥壬丑癸寅
const GU_CHEN={11:2,0:2,1:2,2:5,3:5,4:5,5:8,6:8,7:8,8:11,9:11,10:11}; // 孤辰: 亥子丑寅 寅卯辰巳 巳午未申 申酉戌亥
const GUA_SU={11:10,0:10,1:10,2:1,3:1,4:1,5:4,6:4,7:4,8:7,9:7,10:7}; // 寡宿: 亥子丑戌 寅卯辰丑 巳午未辰 申酉戌未
const KUI_GANG=[[6,4],[6,10],[8,4],[4,10]]; // 魁罡日: 庚辰庚戌壬辰戊戌
const TIAN_DE={2:3,3:8,4:8,5:7,6:11,7:0,8:9,9:2,10:2,11:1,0:5,1:6}; // 天德(月支起): 正丁二申三壬四辛五亥六甲七癸八寅九丙十乙子巳丑庚
const YUE_DE={2:2,6:2,10:2,11:0,3:0,7:0,8:8,0:8,4:8,5:6,9:6,1:6}; // 月德(三合): 寅午戌丙亥卯未甲申子辰壬巳酉丑庚
const HONG_YAN={0:6,1:8,2:2,3:7,4:4,5:4,6:10,7:9,8:0,9:8}; // 红艳(标准): 甲午乙申丙寅丁未戊辰己辰庚戌辛酉壬子癸申
// 劫煞/灾煞/亡神(年支三合局起,对照《三命通会》)
const JIE_SHA={8:5,0:5,4:5,2:11,6:11,10:11,5:2,9:2,1:2,11:8,3:8,7:8}; // 申子辰巳 寅午戌亥 巳酉丑寅 亥卯未申
const ZAI_SHA={8:6,0:6,4:6,2:0,6:0,10:0,5:3,9:3,1:3,11:9,3:9,7:9}; // 申子辰午 寅午戌子 巳酉丑卯 亥卯未酉
const WANG_SHEN={8:11,0:11,4:11,2:5,6:5,10:5,5:8,9:8,1:8,11:2,3:2,7:2}; // 申子辰亥 寅午戌巳 巳酉丑申 亥卯未寅
// 神煞详批: 返回命局所有重要神煞
function zhShenShaQuan(zh){
  const zhis=[['年',zh.yearGZ[1]],['月',zh.monthGZ[1]],['日',zh.dayGZ[1]],['时',zh.hourGZ[1]]];
  const gans=[zh.yearGZ[0],zh.monthGZ[0],zh.dayGZ[0],zh.hourGZ[0]];
  const dg=zh.dg, yearZhi=zh.yearGZ[1], monthZhi=zh.monthGZ[1];
  const res=[];
  // 禄神(日干)
  const lu=LU_SHEN[dg];
  const luPos=zhis.find(([n,z])=>z===lu);
  if(luPos) res.push({name:'禄神',where:luPos[0]+ZHI[lu],cls:'ji',desc:'十干之禄，主衣禄丰厚、根气身旺'+(luPos[0]==='年'?'（岁禄）':luPos[0]==='月'?'（建禄）':luPos[0]==='日'?'（专禄）':'（归禄，主晚年富贵）')});
  // 羊刃(日干帝旺)
  const yr=YANG_REN[dg];
  const yrPos=zhis.find(([n,z])=>z===yr);
  if(yrPos) res.push({name:'羊刃',where:yrPos[0]+ZHI[yr],cls:'xiong',desc:'五行极旺之气，主刚烈果决；身旺忌之，身弱或杀刃相制反主掌权'});
  // 红鸾/天喜(年支)
  const hl=HONG_LUAN[yearZhi], tx=TIAN_XI[yearZhi];
  const hlPos=zhis.find(([n,z])=>z===hl);
  const txPos=zhis.find(([n,z])=>z===tx);
  if(hlPos) res.push({name:'红鸾',where:hlPos[0]+ZHI[hl],cls:'ji',desc:'主婚配喜庆，流年大运逢之多主恋爱婚嫁'});
  if(txPos) res.push({name:'天喜',where:txPos[0]+ZHI[tx],cls:'ji',desc:'主添丁财喜、人缘顺遂'});
  // 金舆(日干)
  const jy=JIN_YU[dg];
  const jyPos=zhis.find(([n,z])=>z===jy);
  if(jyPos) res.push({name:'金舆',where:jyPos[0]+ZHI[jy],cls:'ji',desc:'主车马荣华、配偶助力、享福之象'});
  // 孤辰寡宿(年支三会)
  const gc=GU_CHEN[yearZhi], gs=GUA_SU[yearZhi];
  const gcPos=zhis.find(([n,z])=>z===gc);
  const gsPos=zhis.find(([n,z])=>z===gs);
  if(gcPos) res.push({name:'孤辰',where:gcPos[0]+ZHI[gc],cls:'xiong',desc:'主孤独、亲缘薄，男命尤验'});
  if(gsPos) res.push({name:'寡宿',where:gsPos[0]+ZHI[gs],cls:'xiong',desc:'主孤寡、婚姻迟，女命尤验'});
  // 魁罡(日柱)
  if(KUI_GANG.some(([g,z])=>g===dg&&z===zh.dayGZ[1])) res.push({name:'魁罡',where:'日柱'+GAN[dg]+ZHI[zh.dayGZ[1]],cls:'te',desc:'庚辰庚戌壬辰戊戌为魁罡，主刚毅果断、聪明文章；身旺富贵，身弱多波折，女命婚迟'});
  // 天德月德(月支)
  const td=TIAN_DE[monthZhi], yd=YUE_DE[monthZhi];
  const tdPos=gans.indexOf(td);
  if(tdPos>=0) res.push({name:'天德贵人',where:['年','月','日','时'][tdPos]+GAN[td],cls:'ji',desc:'主逢凶化吉、解灾免祸，心地仁善'});
  const ydPos=gans.indexOf(yd);
  if(ydPos>=0) res.push({name:'月德贵人',where:['年','月','日','时'][ydPos]+GAN[yd],cls:'ji',desc:'主阴德庇佑、凶煞远避'});
  // 红艳(日干)
  const hy=HONG_YAN[dg];
  const hyPos=zhis.find(([n,z])=>z===hy);
  if(hyPos) res.push({name:'红艳',where:hyPos[0]+ZHI[hy],cls:'zhong',desc:'主外貌吸引、异性缘佳，须防多情'});
  // 劫煞/灾煞/亡神(年支三合局,凶煞柔化解释)
  const js=JIE_SHA[yearZhi], zs=ZAI_SHA[yearZhi], ws=WANG_SHEN[yearZhi];
  const jsPos=zhis.find(([n,z])=>z===js);
  if(jsPos) res.push({name:'劫煞',where:jsPos[0]+ZHI[js],cls:'xiong',desc:'三合局绝位，主防财物破耗与口舌是非，宜谨慎守成'});
  const zsPos=zhis.find(([n,z])=>z===zs);
  if(zsPos) res.push({name:'灾煞',where:zsPos[0]+ZHI[zs],cls:'xiong',desc:'帝旺对冲之位，宜注意安全出行、防意外磕碰（柔化解）'});
  const wsPos=zhis.find(([n,z])=>z===ws);
  if(wsPos) res.push({name:'亡神',where:wsPos[0]+ZHI[ws],cls:'xiong',desc:'三合局临官位，宜守机密防口舌，心性沉静则安（柔化解）'});
  return res;
}
function zhRiZhu(zh){
  const dg=zh.dg, dz=zh.dayGZ[1];
  const selfTs=tenGod(dg,ZHI_HIDDEN[dz][0]);
  const dayWX=WUXING[GAN_WX[dg]];
  let s=`巾箱论命，以日柱为本。日主${GAN[dg]}${dayWX}坐${ZHI[dz]}，日坐${SHISHEN_NAME[selfTs]}。`;
  const zuo={
    5:'日坐正财，妻贤家旺、务实持家，一生衣食有靠',
    4:'日坐偏财，善经营聚财、人缘广，然防财来财去',
    7:'日坐正官，自律端方、贵气在身，女命夫缘佳',
    6:'日坐七杀，魄力过人，坐杀有制则权、无制多劳',
    9:'日坐正印，心地仁厚、得学识荫护，利文书清贵',
    8:'日坐偏印，思维独特、善冷门学问，防孤僻多思',
    2:'日坐食神，口福才艺、温文随和，利技艺生财',
    3:'日坐伤官，才华外露、聪明傲物，利创意忌锋芒',
    0:'日坐比肩，独立自主、辛劳自立，兄弟相帮',
    1:'日坐劫财，坐劫多争、财易被分，宜守成防破'
  };
  s+=(zuo[selfTs]!==undefined?zuo[selfTs]:'日坐平和')+'。';
  s+=`日柱纳音${NAYIN[nayinIndex(dg,dz)]}，主先天禀性之质。`;
  const mw=ZHI_WX[zh.monthGZ[1]], dw=GAN_WX[dg];
  const sheng=(dw+4)%5, ke=(dw+3)%5;
  let season;
  if(mw===dw) season=`生逢${WUXING[mw]}月，日主得令气旺，巾诀主'得令者贵，根基深厚'`;
  else if(mw===sheng) season=`生逢${WUXING[mw]}月，印星当令得生，巾诀主'印绶当令，文贵有源'`;
  else if(mw===ke) season=`生逢${WUXING[mw]}月，官杀当令受克，巾诀主'官杀当令须防压力，有制则贵'`;
  else season=`生逢${WUXING[mw]}月，月令耗泄日主，巾诀主'失令者运转方荣，行运扶身则发'`;
  s+=season+'。';
  s+=`综观日柱${GAN[dg]}${ZHI[dz]}，${strengthText(zh,'身强任事、日柱根基厚实，行运喜克泄耗','身弱则日柱待扶，行运喜印比生助')}；巾箱云'字碰字来吉凶昭然'，日柱与岁运之呼应即命机所在。`;
  return s;
}
// 主宾得失(盲派: 以我为主,日时为主位,年月为宾位)
function zhZhuBin(zh){
  const dg=zh.dg;
  const zhuGan=[zh.dayGZ[0],zh.hourGZ[0]], binGan=[zh.yearGZ[0],zh.monthGZ[0]];
  const zhuZhi=[zh.dayGZ[1],zh.hourGZ[1]], binZhi=[zh.yearGZ[1],zh.monthGZ[1]];
  const stat=(gs,zs)=>{ const t=[0,0,0,0,0,0,0,0,0,0]; gs.forEach(g=>{if(g!==dg)t[tenGod(dg,g)]++;}); zs.forEach(z=>t[tenGod(dg,ZHI_HIDDEN[z][0])]++); return t; };
  const zhuTs=stat(zhuGan,zhuZhi), binTs=stat(binGan,binZhi);
  const zc=zhuTs[4]+zhuTs[5], zg=zhuTs[6]+zhuTs[7], zy=zhuTs[8]+zhuTs[9];
  const bc=binTs[4]+binTs[5], bg=binTs[6]+binTs[7], by=binTs[8]+binTs[9];
  let s=`盲派论命，以我为主：日干${GAN[dg]}为「我」，日时为主位（我之家、我之所得、我之身体），年月为宾位（外界、六亲、早年环境）。`;
  s+=`主位（日时）：财星${zc}位、官杀${zg}位、印星${zy}位${zc+zg+zy===0?'，以比劫食伤为主':''}；宾位（年月）：财星${bc}位、官杀${bg}位、印星${by}位。`;
  if(zc>0) s+=`主位见财，财富归于我手，自食其力、求财可得；`;
  if(bc>0&&zc===0) s+=`财在宾位（年月），财为外界之财，须外出经人求财、奔波得之；`;
  if(zg>0) s+=`主位见官杀，权柄归于我，利自立掌权、独当一面；`;
  if(bg>0&&zg===0) s+=`官在宾位，功名仰赖外界提拔，宜借势而进、凭人成事；`;
  if(by>zy) s+=`印星偏宾位，祖荫父辈之助较显，早年得庇；`;
  if(zy>by) s+=`印星归主位，学识修养归于己，自立自强、后发制人。`;
  // 主宾相制(盲派做功)
  const zhuWx=zhuZhi.map(z=>ZHI_WX[z]), binWx=binZhi.map(z=>ZHI_WX[z]);
  const zhuZhiKeBin=zhuWx.some(zw=>binWx.some(bw=>zw===(bw+2)%5));
  const binShengZhu=binWx.some(bw=>zhuWx.some(zw=>bw===(zw+4)%5));
  if(zhuZhiKeBin) s+=`主位地支能制宾位之财官（主位克宾位），为「主位制宾、宾为我用」，命主能得外界之财官权力；`;
  if(binShengZhu) s+=`宾位生主位，外界与六亲多助我，早年环境顺遂；`;
  s+=`盲派心法：'主位制宾则得，宾位生主则助，主位受制则失'——观主宾生克，便知命主一生能得外界几何。`;
  return s;
}

/* ======================== 流派对照（本地引擎版） ======================== */
function zhSchoolContrast(zh){
  const d=zh, ls=zhLiuShen(zh);
  const mz=zh.monthGZ[1], benQi=ZHI_HIDDEN[mz][0], ju=tenGod(d.dg,benQi), juName=SHISHEN_NAME[ju];
  const toud=[zh.yearGZ[0],zh.monthGZ[0],zh.hourGZ[0]].includes(benQi);
  const zhuGan=[d.dayGZ[0],d.hourGZ[0]], zhuZhi=[d.dayGZ[1],d.hourGZ[1]];
  const zc=zhuGan.filter(g=>g!==d.dg&&[4,5].includes(tenGod(d.dg,g))).length+zhuZhi.filter(z=>[4,5].includes(tenGod(d.dg,ZHI_HIDDEN[z][0]))).length;
  const tia=zh.tiaoHouWX;
  return [
    {school:'旺衰平衡派',icon:'⚖️',color:'var(--jade)',
      view:`日主${GAN[d.dg]}${WUXING[GAN_WX[d.dg]]}为${d.strengthType}，${strengthText(d,'身强喜克泄耗（财官食伤）以流通、忌印比帮身','身弱喜印比生扶助身、忌财官食伤再耗')}，以${WUXING[ls.yong]}为用神。`,
      basis:`旺衰评分 ${d.strengthScore} 分；用神${WUXING[ls.yong]}·喜神${WUXING[ls.xi]}·忌神${WUXING[ls.ji]}·仇神${WUXING[ls.chou]}·闲神${ls.xian.map(w=>WUXING[w]).join('、')}；${ls.note}`,
      focus:`看整体能量与运势补益：${strengthText(d,'身强宜开拓进取、以财官收束，忌比劫相争','身弱宜借势合作、行印比运扶身，忌财官重压')}`},
    {school:'子平格局派',icon:'🏛️',color:'var(--gold)',
      view:`月令${ZHI[mz]}，本气${GAN[benQi]}为日主之${juName}，${toud?'透干成「'+juName+'格」，格局显明':'藏而不透为「藏格」，待运引出'};${strengthText(d,'身强足以任格、富贵可期','身弱须行印比运扶身方能担格')}。`,
      basis:`《子平真诠》『八字用神，专求月令』；${[6].includes(ju)?'七杀格以食制杀、印化杀为救应':'格局成败看相神救应与喜忌配置'}；${zh.congGe?'日主极弱弃命从势、成从格':''}`,
      focus:`看事业结构与社会角色：${[5,7,9,4].includes(ju)?juName+'格为善格，主贵气端庄、宜循规守序':'格局主性情鲜明、宜以制化配合成就'}，行运合来成格、冲则破格之年为关键`},
    {school:'盲派象法',icon:'🥷',color:'var(--red2)',
      view:`主位（日时）财星${zc}位、宾位（年月）为外界；${zc>0?'主位见财，财富归于我手、自食其力':'财在宾位，外出经人求财、奔波得之'}。`,
      basis:`主宾制化：主位克宾则得外界财官、宾位生主则六亲多助；盖头截脚、暗合入墓皆做功之象`,
      focus:`看具体事件与现实关系：合冲刑害直断应事、流年只管应期不管吉凶——${strengthText(d,'身强做功有力、可任财官','做功待运助、宜守成积累')}，应期以引动为凭`},
    {school:'穷通调候派',icon:'🌡️',color:'var(--purple)',
      view:tia>=0?`生于${tia===1?'亥子丑月·冬令偏寒':'巳午未月·夏令偏燥'}，宜取${WUXING[tia]}调候（${tia===1?'火暖局':'水润局'}），${zh.wxCount[tia]>=1?'局中已有调候之神，气机得济':'局中缺调候，须行运补之'}。`:`春秋生，寒暖适中，无须强调候，取中和之气。`,
      basis:`《穷通宝鉴》『十干配十二月中气候之宜』；冬生重暖、夏生重润，气候为第一用神`,
      focus:`看气质健康与环境适应：${tia>=0?(tia===1?'冬命宜向阳趋暖、火性行业（能源/文教/餐饮）':'夏命宜近水清凉、水性行业（物流/贸易/IT）'):'中和之命、顺时而动，忌大寒大燥之运'}`},
    {school:'综合多流派',icon:'🧭',color:'var(--gold2)',
      view:`旺衰定喜忌（${strengthLabel(d)}、用${WUXING[ls.yong]}），格局看结构（${juName}格），调候察气质（${tia>=0?'宜'+WUXING[tia]:'中和'}），盲派断应事——四派交叉印证。`,
      basis:`以旺衰+格局为主、调候盲派为辅；冲突时并列展示、说明侧重；大运流年应期贯穿各派`,
      focus:`命局潜力与行运节奏：${d.strengthType}任格，喜用运进、忌神运守，${tia>=0?'调候得济则气机通畅':''}——上下限由格、际遇由运、结果由人`}
  ];
}
/* ======================== 流年时间轴（完整版：过去5年+未来15年） ======================== */
const LN_HE_NAME={0:'甲己合',1:'乙庚合',2:'丙辛合',3:'丁壬合',4:'戊癸合'};
const LN_ZHE_NAME=['子丑合','寅亥合','卯戌合','辰酉合','巳申合','午未合'];
const LN_ZCHONG_NAME=['子午冲','丑未冲','寅申冲','卯酉冲','辰戌冲','巳亥冲'];
const LN_XING_GRP=[[2,5,8],[1,10,7],[0,3]];
const LN_XING_NAME=['寅巳申三刑','丑戌未三刑','子卯刑'];
const LN_HAI_GRP=[[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
const LN_HAI_NAME=['子未害','丑午害','寅巳害','卯辰害','申亥害','酉戌害'];
function liuNianRel(zh,g,z){
  const rels=[];
  const pillars=[['年',zh.yearGZ],['月',zh.monthGZ],['日',zh.dayGZ],['时',zh.hourGZ]];
  const hePairs=[[0,5],[1,6],[2,7],[3,8],[4,9]], ganChong=[[0,6],[1,7],[2,8],[3,9]];
  const zhiHe=[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]], zhiChong=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  pillars.forEach(([pn,pz])=>{
    const pg=pz[0], pzz=pz[1];
    const hp=hePairs.find(([x,y])=>(x===g&&y===pg)||(x===pg&&y===g));
    if(hp) rels.push({type:'合',name:LN_HE_NAME[hp[0]],pillar:pn,power:1.5});
    const gc=ganChong.find(([x,y])=>(x===g&&y===pg)||(x===pg&&y===g));
    if(gc) rels.push({type:'冲',name:GAN[g]+GAN[pg]+'相冲',pillar:pn,power:3});
    const zh2=zhiHe.find(([x,y])=>(x===z&&y===pzz)||(x===pzz&&y===z));
    if(zh2) rels.push({type:'六合',name:LN_ZHE_NAME[zhiHe.indexOf(zh2)],pillar:pn,power:1.5});
    const zc=zhiChong.find(([x,y])=>(x===z&&y===pzz)||(x===pzz&&y===z));
    if(zc) rels.push({type:'六冲',name:LN_ZCHONG_NAME[zhiChong.indexOf(zc)],pillar:pn,power:3});
    LN_XING_GRP.forEach((gr,i)=>{ if(gr.includes(z)&&gr.includes(pzz)) rels.push({type:'三刑',name:LN_XING_NAME[i],pillar:pn,power:2.5}); });
    if(z===pzz&&[3,6,9,11].includes(z)) rels.push({type:'自刑',name:ZHI[z]+ZHI[z]+'自刑',pillar:pn,power:2});
    const lh=LN_HAI_GRP.find(([x,y])=>(x===z&&y===pzz)||(x===pzz&&y===z));
    if(lh) rels.push({type:'六害',name:LN_HAI_NAME[LN_HAI_GRP.indexOf(lh)],pillar:pn,power:2});
  });
  return rels;
}
function zhLiuNianTimeline(zh){
  const now=new Date().getFullYear(), out=[];
  const ls=zhLiuShen(zh); // 用喜忌仇闲精确判定喜用/忌神
  const pillarTag={'年':'祖上/家族','月':'父母/环境','日':'自身/婚姻','时':'子女/晚运'};
  for(let y=now-5;y<=now+15;y++){
    const ni=((y-4)%60+60)%60;
    const [g,z]=indexToGZ(ni);
    const tg=tenGod(zh.dg,g), tgName=SHISHEN_NAME[tg];
    // v5.7 地支十神: 本气藏干十神 + 藏干全息(对原局日主)
    const zz=ZHI_HIDDEN[z]?ZHI_HIDDEN[z][0]:-1;
    const tz=zz>=0?tenGod(zh.dg,zz):-1, tzName=tz>=0?SHISHEN_NAME[tz]:'';
    const zzAll=ZHI_HIDDEN[z]?ZHI_HIDDEN[z].map(h=>GAN[h]+SHISHEN_NAME[tenGod(zh.dg,h)]).join('·'):'';
    const rels=liuNianRel(zh,g,z);
    const totalPow=rels.reduce((a,r)=>a+r.power,0)+(zh.dg!==g?1:0)+(zz>=0&&zh.dg!==zz?0.5:0); // 透干+地支本气引动
    const strong=totalPow>=4?'强':totalPow>=2.5?'中':'弱';
    // 喜用判定: 流年干支五行属用神/喜神=喜用年; 属忌神/仇神=忌神年; 属闲神=看引动
    const wg=GAN_WX[g], wz=ZHI_WX[z];
    const inYong=wg===ls.yong||wz===ls.yong, inXi=wg===ls.xi||wz===ls.xi;
    const inJi=wg===ls.ji||wz===ls.ji, inChou=wg===ls.chou||wz===ls.chou;
    let kind;
    if(inYong||inXi) kind='喜用';
    else if(inJi||inChou) kind='忌神';
    else{
      // 闲神五行之年: 有冲刑害引动则偏忌, 有合引动或无事则平
      const hasChongXing=rels.some(r=>r.type==='六冲'||r.type==='冲'||r.type==='三刑'||r.type==='六害'||r.type==='自刑');
      kind=hasChongXing?'忌神':'平';
    }
    const good=kind==='喜用', bad=kind==='忌神';
    const tags=new Set([kind]);
    if([4,5].includes(tg)) tags.add('财富');
    if([6,7].includes(tg)) tags.add('事业');
    if([8,9].includes(tg)) tags.add('学业');
    if([2,3].includes(tg)) tags.add('才华/子女');
    if([0,1].includes(tg)) tags.add('人际/竞争');
    // v5.7 地支本气十神引动(干支并看)
    if([4,5].includes(tz)) tags.add('财富');
    if([6,7].includes(tz)) tags.add('事业');
    if([8,9].includes(tz)) tags.add('学业');
    if([2,3].includes(tz)) tags.add('才华/子女');
    if([0,1].includes(tz)) tags.add('人际/竞争');
    rels.forEach(r=>{
      if(r.type==='六冲'||r.type==='冲') tags.add('变动');
      if(r.pillar==='日') tags.add('婚姻');
      if(r.type==='三刑'||r.type==='六害'||r.type==='自刑') tags.add('健康');
    });
    if(!rels.length&&kind==='平') tags.add('平运');
    // 提示与建议(对照典籍); v5.7 追加地支本气十神句
    let tip='',adv='';
    const zzTxt=tzName?`；地支${ZHI[z]}本气${GAN[zz]}为日主${tzName}`:'';
    if(rels.length){
      const rn=rels.map(r=>r.name+'·'+r.pillar+'('+pillarTag[r.pillar]+')').join('、');
      const moveType=rels.some(r=>r.type==='六冲'||r.type==='冲')?'动荡多变':rels.some(r=>r.type==='三刑'||r.type==='六害'||r.type==='自刑')?'纠葛反复':'牵动相应';
      tip=`流年${rn}，${moveType}，${pillarTag[rels[0].pillar]}之事被引动${zzTxt}`;
    } else if(kind==='喜用'){ tip=`流年不见合冲刑害，纯喜用之气，气象和顺${zzTxt}`; }
    else if(kind==='忌神'){ tip=`流年不见合冲刑害，忌神当值，宜低调收敛${zzTxt}`; }
    else { tip=`流年不见明显引动，按喜忌顺行即可${zzTxt}`; }
    if(kind==='喜用') adv='喜用之年，如旱逢甘霖，宜进取布局、把握机会（《滴天髓》财气通门户）；行事宜主动';
    else if(kind==='忌神') adv='忌神之年，如逆水行舟，宜守成蓄力、静待时机（《子平真诠》忌神制化则吉）；忌大动作';
    else adv='闲平之年，不动不静，宜稳中求进、按部就班（《渊海子平》闲神如客，不进不退）';
    if(rels.some(r=>r.pillar==='日')&&tags.has('婚姻')) adv+='，感情之事慎抉择';
    out.push({y,g,z,tg,tgName,zz,tz,tzName,zzAll,rels,strong,tags:[...tags],good,bad,kind,tip,adv});
  }
  return out;
}

/* ======================== AI 深度解读（接入大模型 API） ======================== */
const AI_DEF={base:'https://api.deepseek.com/v1',key:'',model:'deepseek-chat',maxTok:8000,sessionOnly:true,divine:false};
const AI_NS='mingli_ai_cfg';
let aiMemoryConfig=null,aiKeyStorage='session';
/* Default to tab-session storage; browser session restoration may retain it. */
function aiMaskKey(k){ if(!k) return ''; return k.length<=10 ? '••••••' : k.slice(0,5)+'••••'+k.slice(-4); }
function aiGetConfig(){
  if(aiMemoryConfig)return {...aiMemoryConfig};
  let raw=null;
  try{ raw=sessionStorage.getItem(AI_NS); }catch(e){}
  if(!raw){ try{ raw=localStorage.getItem(AI_NS); }catch(e){} }
  try{
    const saved=JSON.parse(raw||'null')||{},config=Object.assign({},AI_DEF,saved);
    // Explicit previous persistence choices are preserved; older unmarked keys migrate.
    if(raw&&typeof saved.sessionOnly!=='boolean'){config.sessionOnly=true;aiSaveConfig(config);}
    else aiKeyStorage=config.sessionOnly?'session':'local';
    return config;
  }catch(e){ return Object.assign({},AI_DEF); }
}
function aiSaveConfig(c){
  aiMemoryConfig={...AI_DEF,...c};
  const payload=JSON.stringify(aiMemoryConfig);
  aiKeyStorage='memory';
  try{localStorage.removeItem(AI_NS);}catch(e){}
  try{sessionStorage.removeItem(AI_NS);}catch(e){}
  try{
    if(c.sessionOnly){sessionStorage.setItem(AI_NS,payload);aiKeyStorage='session';}
    else{localStorage.setItem(AI_NS,payload);aiKeyStorage='local';}
  }catch(e){
    aiMemoryConfig.sessionOnly=true;
    try{sessionStorage.setItem(AI_NS,JSON.stringify(aiMemoryConfig));aiKeyStorage='session';}catch(e2){}
  }
}
function aiClearStoredKey(){
  aiMemoryConfig=null;aiKeyStorage='session';
  try{ localStorage.removeItem(AI_NS); }catch(e){}
  try{ sessionStorage.removeItem(AI_NS); }catch(e){}
}
/* —— 统一请求入口：把 BaseURL 归一化，避免用户多填/少填 /v1 —— */


/* —— 服务端 Prompt 模式：研判准则不下发，只上传命盘事实 —— */

function aiDivinePayload(schoolIdx){
  const el=document.getElementById('zh-zw-ref');
  const withZiwei=!!(el&&el.checked);
  const p={
    school:schoolIdx,
    withZiwei:withZiwei,
    knowledge:aiBuildKnowledge(lastZh),
    basic:aiBasicInfo(lastZh),
    chart:aiBuildChart(lastZh),
    zwRef:withZiwei?zhZwRefText(lastZh):'',
    zwGuide:withZiwei?zhZwRefGuide():''
  };
  return p;
}
/* —— 超时包装：非流式请求 —— */

/* —— 状态码 → 可操作的中文提示 —— */

/* —— 统一 SSE 流式：带静默超时 + 总时长上限，返回 {abort} —— */

function aiOpenSettings(){
  const c=aiGetConfig();
  document.getElementById('ai-base').value=c.base||'';
  const kEl=document.getElementById('ai-key');
  kEl.value='';                                   // 不回显明文 Key（防截图/录屏/共享屏幕泄漏）
  kEl.placeholder=c.key?('已保存 '+aiMaskKey(c.key)+' — 留空则沿用'):'sk-...';
  document.getElementById('ai-model').value=c.model||'';
  const mt=document.getElementById('ai-maxtok'); if(mt) mt.value=c.maxTok||'';
  const so=document.getElementById('ai-session-only'); if(so) so.checked=!!c.sessionOnly;
  const dv=document.getElementById('ai-divine'); if(dv) dv.checked=!!c.divine;
  const st=document.getElementById('ai-key-state');
  if(st) st.textContent = c.key
    ? ('当前 Key：'+aiMaskKey(c.key)+' · '+({memory:'仅当前页面内存（刷新失效）',session:'标签页会话保存（浏览器恢复会话可能保留）',local:'已持久化保存在本机'}[aiKeyStorage])+(c.divine?' · 🎭 服务端 Prompt':''))
    : '当前未配置 Key（可使用下方「提取 Prompt」通道，无需 Key）';
  document.getElementById('ai-test-msg').textContent='';
  document.getElementById('ai-modal').style.display='flex';
}
function aiSaveSettings(){
  const prev=aiGetConfig();
  const typed=document.getElementById('ai-key').value.trim();
  const so=document.getElementById('ai-session-only');
  const dv=document.getElementById('ai-divine');
  const mt=parseInt(document.getElementById('ai-maxtok').value||'0',10);
  const next={
    base:document.getElementById('ai-base').value.trim()||AI_DEF.base,
    key:typed||prev.key||'',
    model:document.getElementById('ai-model').value.trim()||'deepseek-chat',
    maxTok:(isFinite(mt)&&mt>0)?mt:0,
    sessionOnly:!!(so&&so.checked),
    divine:!!(dv&&dv.checked)
  };
  aiSaveConfig(next);
  const msg=document.getElementById('ai-test-msg');
  msg.textContent=next.key
    ? ('✅ 已保存（'+aiMaskKey(next.key)+' · '+(next.sessionOnly?'仅本次会话':'本机持久')+'）')
    : '✅ 已保存（未填 Key）';
  aiOpenSettings();                               // 刷新状态条，保持弹窗打开让用户看到结果
  document.getElementById('ai-test-msg').textContent=msg.textContent;
}
function aiClearKey(){
  if(!confirm('确定清除本机保存的 API Key？\n清除后需重新填写才能一键生成（「提取 Prompt」通道不受影响）。')) return;
  aiClearStoredKey();
  const kEl=document.getElementById('ai-key'); if(kEl){kEl.value='';kEl.placeholder='sk-...';}
  const so=document.getElementById('ai-session-only'); if(so) so.checked=false;
  aiOpenSettings();
  document.getElementById('ai-test-msg').textContent='🗑 已清除本机 Key';
}
function aiTestConn(){
  const c=aiGetConfig();
  const base=document.getElementById('ai-base').value.trim()||c.base;
  const key=document.getElementById('ai-key').value.trim()||c.key;
  const model=document.getElementById('ai-model').value.trim()||c.model;
  const msg=document.getElementById('ai-test-msg');
  if(!key){msg.textContent='⚠️ 请先填写 API Key';return;}
  msg.textContent='⏳ 连接中…（最长 30 秒）';
  aiFetch(aiEndpoint({base:base,key:key}),{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
    body:JSON.stringify({model:model,messages:[{role:'user',content:'请回复：连接成功'}],max_tokens:10})
  },30000).then(async r=>{
    if(!r.ok) throw new Error(await aiErrMsg(r));
    msg.textContent='✅ 连接成功！模型可用';
  }).catch(e=>{ msg.textContent='❌ 连接失败：'+e.message; });
}
// 命盘数据序列化(喂给AI的客观数据)
/* 基础信息(醒目放在Prompt最前,避免AI搞混命盘) */
function aiBasicInfo(zh){
  const b=[];
  b.push('姓名：'+(lastName||'未填写'));
  b.push('性别：'+genderLabel(zh));
  b.push('公历：'+zh.date.getFullYear()+'年'+(zh.date.getMonth()+1)+'月'+zh.date.getDate()+'日 '+HOUR_NAMES[zh.hourIdx]);
  b.push('农历：'+zh.lunar.year+'年'+(zh.lunar.isLeap?'闰':'')+lunarMonthName(zh.lunar.month,zh.lunar.isLeap)+lunarDayName(zh.lunar.day)+' '+HOUR_NAMES[zh.hourIdx]);
  b.push('旺衰状态：'+strengthLabel(zh)+'；'+strengthAdvice(zh));
  b.push('时间规则：'+temporalDescription(zh));
  b.push('四柱：'+zh.pillars.map(p=>GAN[p[0]]+ZHI[p[1]]).join(' '));
  if(zh.place){
    const full=zhPlaceFull(zh.place);
    const pw=full?full.wx:zhPlaceWx(zh.place);
    b.push('出生地：'+zh.place+(full?('（复合五行 '+zhPlaceFullName(full.wx,full.sub)+' · '+CITY_WX_DIR[pw]+'）'):'')+(zh.tiaoHouPlaceNote?('；调候修正：'+zh.tiaoHouPlaceNote):''));
  }
  b.push('生肖：'+"鼠牛虎兔龙蛇马羊猴鸡狗猪"[zh.yearGZ[1]]);
  b.push('当前流派：'+(zh.profile?.name||SCHOOLS[lastSchool]));
  b.push('规则版本：'+(zh.ruleVersion||RULE_VERSION)+'；五行口径：天干＋地支本气（分析），'+(zh.wxStatistics?.name||'天干＋地支本气')+'（展示）');
  return b.join('\n');
}
function aiBuildChart(zh){
  const gz=zh.pillars.map((p,i)=>({
    zhu:['年','月','日','时'][i],gan:GAN[p[0]],zhi:ZHI[p[1]],
    ganShiShen:SHISHEN_NAME[tenGod(zh.dg,p[0])],
    hidden:ZHI_HIDDEN[p[1]].map(g=>GAN[g]+SHISHEN_NAME[tenGod(zh.dg,g)]).join('/'),
    changSheng:getChangSheng(zh.dg,p[1]),nayin:NAYIN[nayinIndex(p[0],p[1])]
  }));
  const ls=zhLiuShen(zh);
  const shenSha=typeof zhShenShaQuan==='function'?zhShenShaQuan(zh).map(s=>s.name+'('+s.where+')').join('、'):'';
  const rels=typeof zhGanZhiMap==='function'?zhGanZhiMap(zh).map(r=>r.name+(r.from?'('+r.from+(r.to?'与'+r.to:'')+')':'')).join('、'):'';
  const dy=zh.dy.dyList.map(d=>GAN[d.g]+ZHI[d.z]+'('+d.age+'-'+d.endAge+'岁'+(d.nayin?'·'+d.nayin:'')+')').join('，');
  const chart={
    name:lastName||'',gender:genderLabel(zh),rules:{version:zh.ruleVersion||RULE_VERSION,profile:zh.profile?.key||'combined',useStrategy:zh.profile?.useStrategy||'balance-climate',dayBoundary:zh.temporal?.dayBoundary},
    solar:fmtLocalDate(zh.date),lunar:zh.lunar.year+'年'+zh.lunar.month+'月'+zh.lunar.day+'日'+(zh.lunar.isLeap?'(闰)':'')+' '+HOUR_NAMES[zh.hourIdx],
    pillars:gz,dayGan:GAN[zh.dg],
    strength:zh.strengthType+'('+zh.strengthScore.toFixed(1)+'分)'+(zh.congGe?'·从格':''),
    yongShen:WUXING[zh.yongShen],
    liuShen:{yong:WUXING[ls.yong],xi:WUXING[ls.xi],ji:WUXING[ls.ji],chou:WUXING[ls.chou],xian:ls.xian.map(w=>WUXING[w]).join('、')},
    wxEnergy:{mode:'天干＋地支本气，各计1次，共8次',counts:zh.wxCount,display:zh.wxStatistics},
    strengthBasis:zh.strength,
    temporal:{inputClock:temporalDescription(zh),instantUtc:zh.temporal?.instantUtc},
    shenSha:shenSha,ganZhiRels:rels,dayun:dy,
    liuNian:typeof zhLiuNianDetail==='function'?zhLiuNianDetail(zh).replace(/<[^>]+>/g,''):'',
    tiaoHou:(zh.tiaoHouWX>=0?'生于'+(zh.tiaoHouWX===1?'冬月宜火调候':'夏月宜水调候'):'无')+(zh.tiaoHouPlaceNote?('；'+zh.tiaoHouPlaceNote):''),
    mingGong:ZHI[zh.mingGong],shenGong:ZHI[zh.shenGong],
    ziwei:'五行局'+['水二','木三','金四','土五','火六'][zh.ju-2]+'，紫微'+ZHI[zh.zwPos]+'，命宫'+ZHI[zh.mingGong]+(zh.mingStars.length?'，主星'+zh.mingStars.map(k=>ZW_STARS[k].name).join('、'):''),
    qimen:zh.juInfo?(zh.juInfo.yang?'阳':'阴')+'遁'+zh.juInfo.ju+'局':'' 
  };
  return JSON.stringify(chart,null,1);
}
// 知识库注入(盲派象法+十神心法+取象字典+典籍匹配)
function aiBuildKnowledge(zh){
  let k='';
  k+='【十天干取象】'+GAN_XIANG[zh.dg]+'；\n';
  k+='【地支应身形】'+zh.pillars.map(p=>ZHI[p[1]]+'('+ZHI_BODY[p[1]]+')').join(' ')+'；\n';
  if(zh.mainTenGods.length){
    k+='【主要十神】'+zh.mainTenGods.map(t=>SHISHEN_NAME[t.i]+'('+t.c+'位)').join('、')+'；\n';
    zh.mainTenGods.forEach(t=>{ if(TS_XINFA[t.i]) k+='【'+TS_XINFA[t.i].t+'】'+TS_XINFA[t.i].d+'\n'; });
  }
  const rels=typeof zhGanZhiMap==='function'?zhGanZhiMap(zh):[];
  if(rels.length){
    k+='【干支关系取象】\n';
    rels.forEach(r=>{
      const baseName=r.name.replace(/（.*?）$/,'');
      const xiang=QX_ALL[baseName]||(r.cls==='he'?'主六合和合、亲近牵绊':r.cls==='sanhe'?'主三合成局、聚气得势':r.cls==='chong'?'主冲主动荡、变动迁移':r.cls==='xing'?'主刑伤是非、须谨言慎行':r.cls==='hai'?'主暗损不和、防小人':r.cls==='po'?'主破败损耗、宜守不宜进':'主干支互动');
      k+='· '+baseName+'（'+r.from+(r.to?'与'+r.to:'')+'）：'+xiang+'；\n';
    });
  }
  const cls=typeof matchClassics==='function'?matchClassics(zh):[];
  if(cls.length){
    k+='【典籍匹配】\n';
    cls.forEach(c=>{ k+='· 《'+c.book+'》'+(c.where?'对应「'+c.where+'」':'')+(c.quote?'，原典「'+c.quote+'」':'')+'，解读：'+(c.app||c.text||'')+'；\n'; });
  }
  return k;
}
// Markdown 轻渲染
function aiMd2Html(s){
  const esc=s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines=esc.split('\n');
  let out=[],inList=false;
  lines.forEach(l=>{
    const t=l.trim();
    if(/^#{1,4}\s/.test(t)){inList=false;out.push('<div style="font-weight:700;color:var(--gold);font-size:.95rem;margin:12px 0 4px">'+t.replace(/^#{1,4}\s*/,'')+'</div>');}
    else if(/^[-*•]\s/.test(t)){if(!inList){inList=true;out.push('<div style="margin:4px 0">');}out.push('· '+t.replace(/^[-*•]\s*/,'')+'<br>');}
    else if(/^\d+\.\s/.test(t)){if(!inList){inList=true;out.push('<div style="margin:4px 0">');}out.push(t+'<br>');}
    else if(/^\|/.test(t)){inList=false;out.push('<div style="margin:4px 0">'+t.replace(/\|/g,'｜')+'</div>');}
    else if(t===''){inList=false;out.push('<div style="height:.5em"></div>');}
    else{inList=false;out.push('<div style="margin:4px 0">'+t+'</div>');}
  });
  if(inList)out.push('</div>');
  let html=out.join('');
  html=html.replace(/\*\*([^*]+)\*\*/g,'<b style="color:var(--gold2)">$1</b>');
  html=html.replace(/「([^」]+)」/g,'「<i>$1</i>」');
  return html;
}
// AI 深度解读(流式)
/* 流派对照 AI 填充: 解析【流1】~【流5】段 → 填入 P3 流派对照卡 .sc-ai(本地保留在上) */
function aiApplySchoolContrast(text){
  if(!text) return 0;
  const t=String(text);
  const re=/【流(\d)】\s*([^【]{20,500})/g;
  let m,filled=0;
  while((m=re.exec(t))){
    const idx=parseInt(m[1])-1;
    if(idx>=0&&idx<5){
      const card=document.querySelector('[data-sc="'+idx+'"]');
      if(card){
        const body=card.querySelector('.sc-ai-body');
        if(body) body.innerHTML=aiMd2Html(m[2].replace(/[｜|]\s*$/,'').trim());
        const aiBox=card.querySelector('.sc-ai');
        if(aiBox) aiBox.style.display='block';
        const badge=card.querySelector('.sc-badge');
        if(badge) badge.style.display='inline-block';
        card.style.borderColor='var(--jade)';
        filled++;
      }
    }
  }
  return filled;
}
/* AI 回复切分回填(全局,供流式与粘贴共用): 按【1】~【18】标记切分填入维度卡片 */
function aiRenderDims(full){
  if(!full||!full.trim())return 0;
  const {sections:segs}=parseAiDimensions(full);
  let filled=0, missing=[];
  const present=new Set();
  for(const n in segs){
    const idx=parseInt(n)-1;
    if(idx>=0&&idx<18){
      present.add(idx);
      const el=document.getElementById('ai-dim-'+idx);
      if(el){
        if(idx===16){
          // 综合定档: 本地打分UI保留,AI内容进.dim-ai,并解析AI分数替换大号打分(AI校准)
          const aiBox=el.querySelector('.dim-ai');
          const aiBody=el.querySelector('.dim-ai-body');
          if(aiBox&&aiBody){aiBox.style.display='block';aiBody.innerHTML=aiMd2Html(segs[n].trim());}
          // Legacy Markdown may add interpretation text, never overwrite computed scores.
        }else if(idx===14){
          // 流年应期: 内容既写卡片,也同步到流年时间轴下方的"AI 流年深度解读"区(按21年展开的版本)
          const body=el.querySelector('.ai-dim-body');
          if(body)body.innerHTML=aiMd2Html(segs[n].trim());
          const detailBox=document.getElementById('ai-liunian-detail');
          if(detailBox){
            const detailBody=detailBox.querySelector('.ai-liunian-body');
            if(detailBody) detailBody.innerHTML=aiMd2Html(segs[n].trim());
            detailBox.style.display='block';
          }
          // AI 逐年解读: 解析【YYYY年】行 → 存 window._tlAi 供点击详情条显示 + 卡片 AI 角标
          try{
            const t=String(segs[n]);
            if(!window._tlAi) window._tlAi={};
            const yearRe=/【(\d{4})年?】([^【\n]{2,160})/g;
            let mm;
            while((mm=yearRe.exec(t))){
              const yr=parseInt(mm[1]);
              const txt=mm[2].replace(/[｜|]\s*$/,'').trim();
              if(!yr||!txt) continue;
              window._tlAi[yr]=txt;
              // 卡片 AI 角标
              const card=document.querySelector('[data-year="'+yr+'"]');
              if(card&&!card.querySelector('.tl-ai-badge')){
                const badge=document.createElement('span');
                badge.className='tl-ai-badge';
                badge.textContent='AI';
                badge.style.cssText='position:absolute;top:2px;right:2px;font-size:.5rem;background:var(--jade);color:#fff;border-radius:4px;padding:0 3px;line-height:1.4;z-index:2';
                card.appendChild(badge);
              }
            }
            // 详情条若正显示某年, 刷新以带上 AI 解读
            const box=document.getElementById('tl-detail-box');
            if(box&&box._curY&&window._tlAi[box._curY]) tlSelect(box._curY);
          }catch(e){}
        }else if(idx===13){
          // 大运总览: 写卡片,并同步到时间轴上方的"AI 大运深度解读"区
          const body=el.querySelector('.ai-dim-body');
          if(body)body.innerHTML=aiMd2Html(segs[n].trim());
          const dyBox=document.getElementById('ai-dayun-detail');
          if(dyBox){
            const dyBody=dyBox.querySelector('.ai-dayun-body');
            if(dyBody) dyBody.innerHTML=aiMd2Html(segs[n].trim());
            dyBox.style.display='block';
          }
        }else{
          const body=el.querySelector('.ai-dim-body');
          if(body)body.innerHTML=aiMd2Html(segs[n].trim());
        }
        const badge=el.querySelector('.ai-dim-badge');
        if(badge)badge.style.display='inline-block';
        el.style.borderColor='var(--jade)';
        el.style.background='rgba(45,140,120,.04)';
        filled++;
      }
    }
  }
  for(let i=0;i<18;i++){if(!present.has(i))missing.push(i+1);}
  // 流派对照: AI【流1】~【流5】段填充(P3 流派对照卡)
  try{ aiApplySchoolContrast(full); }catch(e){}
  // 紫微参考维度(独立于18维): AI【紫微专断】段 → ai-dim-18 卡
  try{
    const m18=String(full).match(/【紫微专断】([\s\S]*?)(?=\n【流\d】|【\d+】|$)/);
    if(m18&&m18[1]&&m18[1].trim()){
      const el18=document.getElementById('ai-dim-18');
      if(el18){
        const body18=el18.querySelector('.ai-dim-body');
        if(body18) body18.innerHTML=aiMd2Html(m18[1].trim());
        const badge18=el18.querySelector('.ai-dim-badge');
        if(badge18) badge18.style.display='inline-block';
        el18.style.borderColor='var(--gold)';
      }
    }
  }catch(e){}
  return filled+(missing.length?(-missing.length):0); // 负数表示缺失数量
}
const AI_DIM_NAMES=['旺衰平衡','子平格局','穷通调候','盲派做功','神煞辅助','纳音意象','性格特质','财富运势','事业学业','婚姻感情','六亲缘分','健康提示','人际贵人','大运总览','流年应期','开运建议','综合定档','风险提示'];
/* 按流派生成角色与 dimGuide(18 维解读侧重),返回{role,dimGuide} */

/* 紫微斗数参考摘要(综合排盘勾选"参考紫微斗数"时自动排盘并写入 AI 提示词) */
function zhZwRefText(zh){
  if(!zh||!zh.stars) return '';
  const el=document.getElementById('zh-zw-ref');
  if(el&&!el.checked) return '';
  const juNames=['','','水二','木三','金四','土五','火六']; // 索引=局数(2水二~6火六)
  const hua=['禄','权','科','忌'];
  const mainNames={ziwei:'紫微',tianji:'天机',taiyang:'太阳',wuqu:'武曲',tiantong:'天同',lianzhen:'廉贞',tianfu:'天府',taiyin:'太阴',tanlang:'贪狼',jumen:'巨门',tianxiang:'天相',tianliang:'天梁',qisha:'七杀',pojun:'破军'};
  const s=[];
  s.push('【紫微斗数参考】');
  const mingMain=zh.mingStars&&zh.mingStars.length?('，坐'+zh.mingStars.map(k=>mainNames[k]||k).join('、')):'（空宫）';
  s.push('五行局：'+(juNames[zh.ju]||(zh.ju+'局'))+'；命宫：'+GAN[zh.mgGan]+ZHI[zh.mingGong]+mingMain+'；身宫：'+ZHI[zh.shenGong]);
  const dist=Object.keys(zh.stars).map(k=>(mainNames[k]||k)+'在'+ZHI[zh.stars[k]]+'宫');
  s.push('十四主星：'+dist.join('、'));
  if(zh.siHua&&zh.siHua.length) s.push('生年四化：'+zh.siHua.map((x,i)=>x+'化'+hua[i]).join('、'));
  if(zh.daLim) s.push('大限：'+(zh.daLim.forward?'阳男阴女顺行':'阴男阳女逆行')+'，'+zh.daLim.startAge+'岁起运，每宫十年');
  return s.join('\n');
}
/* 紫微互参指引(勾选"参考紫微斗数"时,让AI把紫微作为第二系统交叉验证八字) */
function zhZwRefGuide(){
  const el=document.getElementById('zh-zw-ref');
  if(el&&!el.checked) return '';
  return [
    '【紫微互参指引】',
    '请把上方紫微斗数数据作为八字论断的"第二系统"交叉验证，双系统互参互证：',
    '1) 性格底色：命宫主星（太阳开朗、武曲刚毅、天同随和、贪狼多才、天机善思等）定气质，与日主十神性情互证，异同处点明；',
    '2) 事业财富：官禄宫、财帛宫主星及生年四化落宫提示成就倾向与财源性质，与八字财官印互参；',
    '3) 婚姻感情：夫妻宫主星（含煞星/吉星组合）与八字婚姻宫、婚姻十神对照印证；',
    '4) 行运节奏：紫微大限（每宫十年、顺逆、起运岁）与八字大运对照——两套行运系统同段同吉凶则加重权重，冲突处单独辩证（如八字走财运而紫微大限逢忌，提示财来财去需守）；',
    '5) 四化焦点：生年禄权科忌四化星=人生发力点，化入何宫提示精力投注方向（化禄入财帛利聚财、化忌入疾厄须顾健康等）；',
    '6) 身宫追求：身宫主星=后天人生重心与追求方向（命宫先天、身宫后天），与命宫对照看先后天变化；',
    '7) 特殊格局：留意本盘是否有紫府同宫、杀破狼（七杀·破军·贪狼）、机月同梁、阳梁昌禄、火贪格等组合，有则按格局断语展开；',
    '8) 命宫四化：命宫主星若带四化（禄权科忌），该星特质被放大或转化，优先引用其变化后的含义。',
    '要求：至少8个维度明确写"紫微佐证：…"引用具体星曜（如"紫微佐证：命宫太阳庙主性格开朗外向"），紫微解读约占各段篇幅三成；其余维度可简略带过；若两系统结论相佐，如实指出并给倾向性判断。'
  ].join('\n');
}
function aiBuildSchoolPrompt(schoolIdx, mode){
  const chart=serializeChart(lastZh);
  if(mode==='extract')return buildEvidencePrompt(chart,schoolIdx,{mode:document.getElementById('ai-output-format')?.value==='markdown'?'markdown':'json'});
  const sp=buildEvidencePrompt(chart,schoolIdx,{mode:'markdown'});
  const zw=zhZwRefText(lastZh)?'\n【紫微参考边界】仅作独立传统规则参考，不等于科学交叉验证；出处未核验，不强制原文或评分。':'';
  return {system:sp.system+'\n【原项目知识线索：出处尚待核验】\n'+aiBuildKnowledge(lastZh)+zw,
    user:'【基础信息（确认本盘身份，勿与它盘混淆）】\n'+aiBasicInfo(lastZh)+'\n\n【命盘数据】\n'+aiBuildChart(lastZh)+(zhZwRefText(lastZh)?('\n\n'+zhZwRefText(lastZh)+'\n\n'+zhZwRefGuide()):'')};
}
/* 提取 Prompt(无API Key时复制到任意AI对话使用) */
function aiExtractPrompt(){
  if(!lastZh){alert('请先排盘');return;}
  const {system}=aiBuildSchoolPrompt(lastSchool,'extract');
  const {user}=aiBuildSchoolPrompt(lastSchool,'extract');
  document.getElementById('ai-prompt-text').value=system+'\n\n【命盘数据】\n'+user;
  document.getElementById('ai-reply-text').value='';
  document.getElementById('ai-prompt-modal').style.display='flex';
}
/* 复制 Prompt */
function aiCopyPrompt(){
  const ta=document.getElementById('ai-prompt-text');
  ta.select();ta.setSelectionRange(0,99999);
  const done=()=>{document.getElementById('ai-prompt-msg').textContent='✅ 已复制，粘贴到任意 AI 对话（如 WorkBuddy / DeepSeek / ChatGPT）中发送';};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(ta.value).then(done).catch(()=>{try{document.execCommand('copy');done();}catch(e){document.getElementById('ai-prompt-msg').textContent='❌ 复制失败，请手动全选复制';}});
  }else{
    try{document.execCommand('copy');done();}catch(e){document.getElementById('ai-prompt-msg').textContent='❌ 复制失败，请手动全选复制';}
  }
}
/* 粘贴 AI 回复回填 18 维卡片 */
/* 【18】风险提示缺失时本地引擎兜底(流式/粘贴共用) */
function aiFallbackRisk(){
  if(typeof zhFengXian!=='function'||!lastZh) return 0;
  if(aiDimHas(17)) return 0; // 已填,无需兜底
  const el=document.getElementById('ai-dim-17');
  if(!el) return 0;
  const body=el.querySelector('.ai-dim-body');
  if(body) body.innerHTML='<span style="color:var(--jade);font-size:.62rem">🤖 本地引擎兜底（AI 未输出【18】段）</span><br>'+zhFengXian(lastZh);
  const badge=el.querySelector('.ai-dim-badge');
  if(badge){badge.style.display='inline-block';badge.textContent='本地兜底';badge.style.background='var(--orange)';}
  el.style.borderColor='var(--orange)';
  return 1;
}
/* 紫微参考维度兜底: AI未输出【紫微专断】段时,用本地紫微摘要填充 ai-dim-18 */
function aiFallbackZwRef(){
  if(typeof zhZwRefText!=='function'||!lastZh) return 0;
  const el=document.getElementById('ai-dim-18');
  if(!el) return 0;
  const badge=el.querySelector('.ai-dim-badge');
  if(badge&&badge.style.display==='inline-block') return 0; // 已有AI内容
  const body=el.querySelector('.ai-dim-body');
  const zwTxt=zhZwRefText(lastZh);
  if(!zwTxt) return 0;
  if(body) body.innerHTML='<span style="color:var(--gold);font-size:.62rem">🤖 本地紫微参考（AI 未输出【紫微专断】段）</span><br>'+zwTxt.replace(/【紫微斗数参考】\n?/,'');
  if(badge){badge.style.display='inline-block';badge.textContent='本地';badge.style.background='var(--orange)';}
  return 1;
}
function aiApplyReply(){
  const text=document.getElementById('ai-reply-text').value;
  if(!text.trim()){alert('请先粘贴AI回复');return;}
  aiEvidenceApplyText(text);
  document.getElementById('ai-prompt-msg').textContent='已处理；请查看卡片上的校验状态和AI区的错误清单。';
}
function aiDimHas(idx){
  const el=document.getElementById('ai-dim-'+idx);
  return !!(el&&el.querySelector('.ai-dim-badge')&&el.querySelector('.ai-dim-badge').style.display==='inline-block');
}
function aiDeepAnalyze(){aiEvidenceStart();}
/* 极简转义（错误信息可能含后端原文） */

function zhAnalysis(zh){
  const synthesis=buildMingGeSummary(zh);
  const dims=[
    {icon:"⚖️",title:"旺衰平衡",content:zhWangShuai(zh)},
    {icon:"🏛️",title:"子平格局",content:zhGeJu(zh)},
    {icon:"🌡️",title:"穷通调候",content:zhTiaoHou(zh)},
    {icon:"⚒️",title:"盲派做功",content:zhZhuBin(zh)+zhHeChongXiang(zh)},
    {icon:"✨",title:"神煞辅助",content:zhShenShaZhu(zh)},
    {icon:"🎐",title:"纳音意象",content:zhNaYinXiang(zh)},
    {icon:"🎭",title:"性格特质",content:zhXingGe(zh)},
    {icon:"💰",title:"财富运势",content:zhCaiFu(zh)},
    {icon:"🎓",title:"事业学业",content:zhXueYe(zh)},
    {icon:"💞",title:"婚姻感情",content:zhHunYin(zh)},
    {icon:"👨‍👩‍👧‍👦",title:"六亲缘分",content:zhLiuQin(zh)},
    {icon:"🌿",title:"健康提示",content:zhJianKang(zh)},
    {icon:"🤝",title:"人际贵人",content:zhRenJi(zh)},
    {icon:"🛤️",title:"大运总览",content:zhDaYunZongLan(zh)},
    {icon:"📅",title:"流年应期",content:zhLiuNianDetail(zh)},
    {icon:"🔮",title:"开运建议",content:zhJianYi(zh)},
    {icon:"🎯",title:"综合定档",content:mingGeEscape(synthesis.headline)},
    {icon:"⚠️",title:"风险提示",content:zhFengXian(zh)}
  ];
  // The same factual reading model drives the overview, pattern detail and closing synthesis.
  const total=mingGeEscape(synthesis.headline)+'取用：'+mingGeEscape(synthesis.useGod.profile)+'，当前取'+mingGeEscape(synthesis.useGod.selected)+'。'+(synthesis.useGod.conflict?'扶抑与调候分列，结合各自用途细看。':'')+zh.dy.startAge+'岁起运，运中补字见总断的行运看点。';
  return {dims,total};
}
/* ============ v5.4 出生地五行参考（方位补益·全国省/地级市/县级市全覆盖） ============ */
// 城市→方位五行(传统方位补益: 东木/南火/西金/北水/中土, 按省市域主位; 五行索引 木0火1土2金3水4)
// 层级: 省级(兜底)→地级市→县级市/县; 键均≥2字完整地名, 互不为子串冲突者用"最长优先+同长后者优先"精确匹配


// 城市→方位五行(供调候修正/参考卡/AI prompt/合婚复用; 五行索引 木0火1土2金3水4)
// 匹配策略: 最长优先 + 同长后者优先 —— 输入"省+市+县"全称时取最具体键("吉林省吉林市"→吉林市,"青海海南藏族自治州"→海南州), 省级键兜底
/* ============ v5.6 复合五行（主=方位 · 次=九州分野/山川水系/矿藏气候） ============ */
// 次五行表: 综合多方权威——《三命通会》九州分野(兖青木·徐扬火·豫土·荆梁金·冀雍水)+风水形势派山川形胜+江河湖海水系+矿藏(荆楚有色金属·山西煤铁)+气候带(五运六气寒暖燥湿)
// 与主五行(方位)合成复合五行: 吉林=水木(长白山·松花江) 新疆=金水(天山雪·大漠) 上海=木水(长江口) 重庆=金水(两江交汇) 山西=水金(煤铁) 湖南=火金(有色金属) 陕西=金土(黄土高原)

// 出生地匹配: 返回 {key, wx} (最长优先+同长后者优先)


// 复合五行: 返回 {key,wx,sub}; sub=次五行(-1=无,即纯气)

// 复合五行名: 水木(主水·次木) / 金水(主金·次水) / 纯水 ...

/* ============ v5.5 出生地选择器（省→市/区县 两级小卡片） ============ */
// 省/直辖市/自治区 → 该省收录的城市键(与CITY_WX键一致; 港澳无下级)
const CITY_TREE={
  '北京':['朝阳区','海淀区','丰台区','通州区','顺义区','昌平区','大兴区','房山区','西城区','东城区','石景山区','怀柔区'],
  '天津':['和平区','河东区','河西区','南开区'],
  '河北':['石家庄','唐山','秦皇岛','邯郸','邢台','保定','张家口','承德','沧州','廊坊','衡水','迁安','遵化','武安','涿州','定州','辛集','河间','霸州','三河','泊头','深州','晋州','新乐','安国','任丘','黄骅'],
  '山西':['太原','大同','阳泉','长治','晋城','朔州','晋中','运城','忻州','临汾','吕梁','侯马','霍州','古交','高平','原平','永济','河津','介休'],
  '内蒙古':['呼和浩特','包头','乌海','赤峰','通辽','鄂尔多斯','呼伦贝尔','巴彦淖尔','乌兰察布','兴安','锡林郭勒','阿拉善','满洲里','牙克石','乌兰浩特','二连浩特','锡林浩特','霍林郭勒','阿尔山','扎兰屯'],
  '辽宁':['沈阳','大连','鞍山','抚顺','本溪','丹东','锦州','营口','阜新','辽阳','盘锦','铁岭','朝阳','葫芦岛','瓦房店','普兰店','庄河','海城','大石桥','盖州','凌海','北镇','灯塔','调兵山','开原','凌源','北票','兴城','新民','法库'],
  '吉林':['长春','吉林市','四平','辽源','通化','白山','松原','白城','延边','公主岭','梅河口','集安','临江','延吉','图们','敦化','龙井','珲春','和龙','大安','洮南','舒兰','桦甸','蛟河','磐石'],
  '黑龙江':['哈尔滨','齐齐哈尔','鸡西','鹤岗','双鸭山','大庆','伊春','佳木斯','七台河','牡丹江','黑河','绥化','大兴安岭','尚志','双城','五常','阿城','讷河','嫩江','北安','五大连池','铁力','海伦','安达','肇东','绥芬河','穆棱','密山','虎林'],
  '上海':['浦东新区','徐汇区','静安区','闵行区','宝山区','嘉定区','松江区','青浦区','崇明'],
  '江苏':['南京','苏州','无锡','常州','南通','徐州','连云港','淮安','盐城','扬州','镇江','泰州','宿迁','昆山','张家港','常熟','太仓','江阴','宜兴','丹阳','扬中','泰兴','靖江','启东','海安','如皋','沭阳','邳州','新沂'],
  '浙江':['杭州','宁波','温州','嘉兴','湖州','绍兴','金华','衢州','舟山','台州','丽水','义乌','慈溪','余姚','诸暨','瑞安','乐清','温岭','永康','临海','桐乡','海宁','东阳','兰溪','嵊州','江山'],
  '安徽':['合肥','芜湖','蚌埠','淮南','马鞍山','淮北','铜陵','安庆','黄山','滁州','阜阳','宿州','六安','亳州','池州','宣城','天长','宁国','桐城','潜山','界首','明光','广德'],
  '福建':['福州','厦门','莆田','三明','泉州','漳州','南平','龙岩','宁德','晋江','石狮','福清','长乐','南安','惠安','安溪','龙海','福鼎','福安','武夷山','永安','邵武'],
  '江西':['南昌','景德镇','萍乡','九江','新余','鹰潭','赣州','吉安','宜春','抚州','上饶','瑞昌','乐平','贵溪','瑞金','南康','井冈山','丰城','樟树','高安','德兴','共青城'],
  '山东':['济南','青岛','淄博','枣庄','东营','烟台','潍坊','济宁','泰安','威海','日照','临沂','德州','聊城','滨州','菏泽','滕州','邹城','肥城','新泰','诸城','寿光','青州','高密','龙口','莱州','招远','乳山','荣成','文登','曲阜','兖州','平度','莱西','胶州'],
  '河南':['郑州','开封','洛阳','平顶山','安阳','鹤壁','新乡','焦作','濮阳','许昌','漯河','三门峡','南阳','商丘','信阳','周口','驻马店','济源','巩义','新郑','荥阳','登封','新密','偃师','汝州','林州','辉县','卫辉','沁阳','孟州','长葛','禹州','永城','邓州','项城'],
  '湖北':['武汉','黄石','十堰','宜昌','襄阳','鄂州','荆门','孝感','荆州','黄冈','咸宁','随州','恩施','仙桃','潜江','天门','大冶','宜都','枝江','当阳','枣阳','宜城','老河口','广水','麻城','武穴','赤壁'],
  '湖南':['长沙','株洲','湘潭','衡阳','邵阳','岳阳','常德','张家界','益阳','郴州','永州','怀化','娄底','湘西','浏阳','宁乡','醴陵','攸县','耒阳','常宁','韶山','湘乡','汨罗','临湘','津市市','沅江','资兴','冷水江','涟源','洪江','吉首'],
  '广东':['广州','韶关','深圳','珠海','汕头','佛山','江门','湛江','茂名','肇庆','惠州','梅州','汕尾','河源','阳江','清远','东莞','中山','潮州','揭阳','云浮','增城','从化','英德','连州','台山','开平','鹤山','恩平','廉江','雷州','吴川','高州','化州','信宜','高要','四会','兴宁','陆丰','阳春','普宁','罗定'],
  '广西':['南宁','柳州','桂林','梧州','北海','防城港','钦州','贵港','玉林','百色','贺州','河池','来宾','崇左','岑溪','东兴','凭祥','合山','靖西','荔浦','北流','桂平','宜州'],
  '海南':['海口','三亚','三沙','儋州','五指山','琼海','文昌','万宁'],
  '重庆':['渝中区','江北区','南岸区','九龙坡区','渝北区','沙坪坝区'],
  '四川':['成都','自贡','攀枝花','泸州','德阳','绵阳','广元','遂宁','内江','乐山','南充','眉山','宜宾','广安','达州','雅安','巴中','资阳','阿坝','甘孜','凉山','都江堰','彭州','邛崃','崇州','简阳','广汉','什邡','绵竹','江油','阆中','华蓥','万源','射洪','隆昌','西昌'],
  '贵州':['贵阳','六盘水','遵义','安顺','毕节','铜仁','黔西南','黔东南','黔南','清镇','赤水','仁怀','凯里','都匀','兴义','福泉'],
  '云南':['昆明','曲靖','玉溪','保山','昭通','丽江','普洱','临沧','楚雄','红河','文山','西双版纳','大理','德宏','怒江','迪庆','安宁','宣威','景洪','芒市','瑞丽','个旧','开远','蒙自','弥勒'],
  '西藏':['拉萨','日喀则','昌都','林芝','山南','那曲','阿里'],
  '陕西':['西安','铜川','宝鸡','咸阳','渭南','延安','汉中','榆林','安康','商洛','兴平','韩城','华阴','神木','府谷','靖边','定边','彬州','子长','志丹'],
  '甘肃':['兰州','嘉峪关','金昌','白银','天水','武威','张掖','平凉','酒泉','庆阳','定西','陇南','临夏','甘南','玉门','敦煌','合作','庆城','环县','镇原','宁县'],
  '青海':['西宁','海东','海北','黄南','海南藏族','果洛','玉树','海西','格尔木','德令哈','同仁','共和'],
  '宁夏':['银川','石嘴山','吴忠','固原','中卫','灵武','青铜峡','中宁'],
  '新疆':['乌鲁木齐','克拉玛依','吐鲁番','哈密','昌吉','博尔塔拉','巴音郭楞','阿克苏','克孜勒苏','喀什','和田','伊犁','塔城','阿勒泰','石河子','阿拉尔','图木舒克','五家渠','伊宁','奎屯','博乐'],
  '台湾':['台北','高雄','台中','台南','新竹','基隆','嘉义','桃园','花莲','台东','新北','彰化','屏东'],
  '香港':[],'澳门':[]
};
let ppTarget='zh-place'; // 当前选择器目标输入框
function zhOpenPicker(id){
  ppTarget=id||'zh-place';
  const pk=document.getElementById('place-picker');
  if(!pk) return;
  renderProvChips();
  pk.style.display='flex';
}
function closePlacePicker(){
  const pk=document.getElementById('place-picker');
  if(pk) pk.style.display='none';
}
function renderProvChips(){
  const box=document.getElementById('pp-prov'),cb=document.getElementById('pp-city');if(!box)return;
  box.replaceChildren(...[...new Set(CITY_DATA.cities.map(c=>c.region))].map(region=>{const b=document.createElement('button');b.type='button';b.className='pp-chip';b.textContent=region;b.onclick=()=>renderCityChips(region);return b;}));
  if(cb)cb.textContent='先选地区；城市坐标来自GeoNames（WGS84）';
}
function renderCityChips(prov){
  const box=document.getElementById('pp-city');if(!box)return;
  box.replaceChildren(...CITY_DATA.cities.filter(c=>c.region===prov).map(c=>{const b=document.createElement('button');b.type='button';b.className='pp-chip';b.textContent=c.name;b.title=c.longitude+'°E, '+c.latitude+'°N';b.onclick=()=>pickPlaceCity(prov,c.id);return b;}));
}
function pickPlaceCity(prov,id){
  const city=resolveLocation(id),el=document.getElementById(ppTarget);if(el)el.value=locationLabel(city);closePlacePicker();
}
// 出生地五行参考卡: 地气 vs 日主/喜用 + 调候修正 + 宜发展方位(八字定命、方位补运)
function zhBirthPlace(zh){
  try{
    const plc=(zh.place||'').trim();
    if(!plc) return '';
    const full=zhPlaceFull(plc);
    if(!full||full.wx<0) return '';
    const wz=full.wx, sub=full.sub;
    const wn=WUXING[wz];
    const dw=GAN_WX[zh.dg];
    const yw=zh.yongShen;
    const subTxt=(sub>=0&&sub!==wz)?('·兼'+WUXING[sub]+'气'):(sub===wz?'·纯'+WUXING[sub]+'气':'');
    const fullName=zhPlaceFullName(wz,sub);
    let rel='',rc='var(--ink2)';
    if(wz===dw){ rel='同气共鸣——生于与日主同五行之地，地气与命气相通，扎根安稳'; rc='var(--gold)'; }
    else if(wz===(dw+1)%5){ rel='五行相生（'+wn+'生'+WUXING[dw]+'）——地气滋养日主，环境助力成长'; rc='var(--jade)'; }
    else if(wz===(dw+4)%5){ rel='五行相生（'+WUXING[dw]+'生'+wn+'）——日主泄气于地，早年环境耗用较多，宜借地气生发'; rc='var(--orange)'; }
    else { rel='五行相克——地气与日主相战，早年环境多有磨砺，中后期宜向喜用方位迁移'; rc='var(--red)'; }
    // 次五行补充
    if(sub>=0&&sub!==wz){
      if(sub===dw) rel+=' 且次气'+WUXING[sub]+'亦同日主，双气共振，得力更显';
      else if(sub===(dw+1)%5) rel+=' 次气'+WUXING[sub]+'复生日主，助益叠加';
      else if(sub===(dw+4)%5) rel+=' 次气'+WUXING[sub]+'受日主所生，耗中有养';
    }
    let ywTxt='',yc='var(--ink2)';
    if(yw!==undefined){
      if(wz===yw){ ywTxt='出生地主五行正是命之喜用，生于得力之地，先天有补'; yc='var(--jade)'; }
      else if(wz===(yw+2)%5||wz===(yw+3)%5){ ywTxt='出生地主五行克伤喜用，先天环境对此盘略有消耗，宜择喜用方位发展'; yc='var(--red)'; }
      else { ywTxt='出生地主五行与喜用无直接生克，中平'; yc='var(--ink2)'; }
      if(sub>=0&&sub!==wz){
        if(sub===yw) ywTxt+='；次气'+WUXING[sub]+'正合喜用，亦有补益';
        else if(sub===(yw+2)%5||sub===(yw+3)%5) ywTxt+='；次气'+WUXING[sub]+'稍克喜用，宜加留意';
      }
    }
    const goodDir=yw!==undefined?CITY_WX_DIR[yw]:CITY_WX_DIR[wz];
    return `<div class="section-block"><h3>📍 出生地五行参考 <span style="font-size:.68rem;color:var(--ink3);font-weight:400">（复合五行 · 方位为主·九州分野/山川水系为次，传统地运参考，不改命局本体）</span></h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
        <div style="text-align:center;min-width:120px;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:7px 12px"><div style="font-size:.6rem;color:var(--ink3);letter-spacing:.15em">出 生 地</div><div style="font-size:.92rem;font-weight:700;color:var(--gold)">${esc0(plc)}</div></div>
        <div style="text-align:center;min-width:150px;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:7px 12px"><div style="font-size:.6rem;color:var(--ink3);letter-spacing:.15em">复合五行</div><div style="font-size:.92rem;font-weight:700;color:var(--c-${WUXING_CLS[wn]})">${fullName}</div><div style="font-size:.62rem;color:var(--ink3);margin-top:2px">${CITY_WX_DIR[wz]}${subTxt}</div></div>
        <div style="text-align:center;min-width:110px;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:7px 12px"><div style="font-size:.6rem;color:var(--ink3);letter-spacing:.15em">宜发展方位</div><div style="font-size:.92rem;font-weight:700;color:var(--jade)">${goodDir}</div></div>
      </div>
      <div style="font-size:.76rem;color:var(--ink2);line-height:1.8;padding:8px 12px;background:var(--card2);border:1px solid var(--line);border-radius:8px">
        <div style="color:${rc}">· 地气与日主：${rel}。</div>
        <div style="color:${yc}">· 地气与喜用：${ywTxt}。</div>
        ${zh.tiaoHouPlaceNote?('<div style="color:var(--gold);margin-top:4px">· 调候修正：'+zh.tiaoHouPlaceNote+'。</div>'):''}
        <div style="color:var(--ink3);font-size:.7rem;margin-top:4px">注：复合五行以方位为主气、九州分野与山川水系为次气（如吉林=水木、新疆=金水），主次合参；八字定命、方位补运，仅供参考，非改命之论。</div>
      </div></div>`;
  }catch(e){ return ''; }
}

/* ============ 总断先读提纲与配合，详细证据和行运按需展开 ============ */
// Keep the legacy function name for export callers; all views read the same synthesis model.
function zhGeJuZhuangTai(zh){
  const s=buildMingGeSummary(zh);
  return {state:s.state,level:'线索',desc:s.headline};
}
function zhMingGeCard(zh){
  return '<div class="section-block mingge-summary"><h3>命格总断 <span>先看提纲，再察配合</span></h3>'+mingGeSummaryBody(zh)+'</div>';
}
// ② 五维能量雷达: 十神五组(财/官杀/食伤/印/比劫) → SVG 五轴雷达(借鉴命格宇宙量化法: 透干计2、藏干本气计1)
function zhWuWeiRadar(zh){
  try{
    const groups=[{k:'cai',n:'财富',ts:[4,5]},{k:'quan',n:'权力',ts:[6,7]},{k:'caihua',n:'才华',ts:[2,3]},{k:'zhishi',n:'智识',ts:[8,9]},{k:'yizhi',n:'意志',ts:[0,1]}];
    const gans=[zh.yearGZ[0],zh.monthGZ[0],zh.dayGZ[0],zh.hourGZ[0]];
    const zhis=[zh.yearGZ[1],zh.monthGZ[1],zh.dayGZ[1],zh.hourGZ[1]];
    const rv=groups.map(g=>{
      let s=0;
      gans.forEach(gz=>{ if(g.ts.includes(tenGod(zh.dg,gz))) s+=2; });
      zhis.forEach(z=>{ const hz=ZHI_HIDDEN[z]&&ZHI_HIDDEN[z][0]; if(hz!==undefined&&g.ts.includes(tenGod(zh.dg,hz))) s+=1; });
      return Math.max(8,Math.min(100,Math.round(s/12*100)));
    });
    const labels=groups.map(g=>g.n);
    const cw=250,chh=195,cx=cw/2,cy=chh/2-6,rad=70;
    const ang=i=>-Math.PI/2+i*2*Math.PI/5;
    const pxy=(i,r)=>[cx+r*Math.cos(ang(i)),cy+r*Math.sin(ang(i))];
    const grid=Array.from({length:4},(_,k)=>{const r=rad*(k+1)/4;return Array.from({length:5},(_,i)=>pxy(i,r).map(v=>v.toFixed(1)).join(',')).join(' ');}).map(g=>`<polygon points="${g}" fill="none" stroke="var(--line)" stroke-width=".8"/>`).join('');
    const dataPts=rv.map((v,i)=>pxy(i,rad*v/100).map(x=>x.toFixed(1)).join(',')).join(' ');
    const rl=labels.map((l,i)=>{const [x,y]=pxy(i,rad+15);return `<text x="${x.toFixed(1)}" y="${(y+3.5).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--ink2)" font-weight="600">${l}</text>`;}).join('');
    const rvTxt=rv.map((v,i)=>{const [x,y]=pxy(i,rad*v/100);return `<text x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--gold)" font-weight="bold">${v}</text>`;}).join('');
    const svg=`<svg viewBox="0 0 ${cw} ${chh}" style="width:250px;max-width:100%">${grid}<polygon points="${dataPts}" fill="rgba(176,138,62,.16)" stroke="var(--gold)" stroke-width="1.6" stroke-linejoin="round"/>${rl}${rvTxt}</svg>`;
    return `<div class="section-block"><h3>⚡ 五维能量雷达 <span style="font-size:.68rem;color:var(--ink3);font-weight:400">（十神五组能量 · 借鉴命格宇宙量化法）</span></h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        ${svg}
        <div style="flex:1;min-width:200px;font-size:.75rem;color:var(--ink2);line-height:1.9">
          <div><b style="color:var(--gold)">财富</b>=财星（聚敛变现）· <b style="color:var(--gold)">权力</b>=官杀（掌控规则）</div>
          <div><b style="color:var(--gold)">才华</b>=食伤（创造表达）· <b style="color:var(--gold)">智识</b>=印星（沉淀吸收）</div>
          <div><b style="color:var(--gold)">意志</b>=比劫（自我支撑）——十神本就分五组，直接量化为五维面板。</div>
          <div style="color:var(--ink3);font-size:.7rem;margin-top:4px">计法：天干透出权重2、地支本气藏干权重1，按十神归类求和归一化（满权12）。</div>
        </div>
      </div></div>`;
  }catch(e){ return ''; }
}
// ③ 大运能量净值曲线: 身强喜克泄耗(财官食伤=吉)/身弱喜生扶(印比=吉), 大运地支冲日支减分 → 8步折线(借鉴命格宇宙确定性推演)
function zhDayunCurve(zh){
  try{
    const dl=zh.dy&&zh.dy.dyList;
    if(!dl||!dl.length) return '';
    const strong=zh.strong;
    if(strengthLabel(zh)==='中和'||zh.congGe) return '<div class="tip">'+strengthLabel(zh)+'：大运不按二元身强/身弱能量曲线套算，请结合格局与行运解读。</div>';
    const ji=[4,5,6,7], xie=[2,3], sheng=[8,9,0,1];
    const vals=dl.map(dy=>{
      const tg=tenGod(zh.dg,dy.g);
      let v=50;
      if(strong){ if(ji.includes(tg)||xie.includes(tg)) v+=24; if(sheng.includes(tg)) v-=20; }
      else{ if(sheng.includes(tg)) v+=24; if(ji.includes(tg)) v-=20; if(xie.includes(tg)) v-=10; }
      const chong=[0,6].includes(Math.abs(dy.z-zh.dayGZ[1]))?-6:0;
      return Math.max(6,Math.min(94,Math.round(v+chong)));
    });
    const hi=vals.indexOf(Math.max(...vals));
    const cw=520,chh=130,padL=30,padR=10,padT=12,padB=22;
    const step=(cw-padL-padR)/(vals.length-1||1);
    const yy=v=>padT+(1-v/100)*(chh-padT-padB);
    const pts=vals.map((v,i)=>[padL+i*step,yy(v)]);
    const poly=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
    const area='M'+pts[0][0].toFixed(1)+','+(chh-padB).toFixed(1)+' L'+poly.split(' ').join(' L')+' L'+pts[pts.length-1][0].toFixed(1)+','+(chh-padB).toFixed(1)+' Z';
    const xLabels=dl.map((dy,i)=>`<text x="${(padL+i*step).toFixed(1)}" y="${chh-6}" text-anchor="middle" font-size="8.6" fill="${i===hi?'var(--gold)':'var(--ink3)'}" font-weight="${i===hi?'700':'400'}">${GAN[dy.g]}${ZHI[dy.z]}</text>`).join('');
    const dots=pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===hi?4.5:3}" fill="${i===hi?'var(--gold)':'var(--gold2)'}"${i===hi?' stroke="#fff" stroke-width="1"':''}/>`).join('');
    const hiTxt=hi>=0?`<text x="${pts[hi][0].toFixed(1)}" y="${(pts[hi][1]-9).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--gold)" font-weight="700">高光</text>`:'';
    const gridLines=[25,50,75].map(g=>{const y=yy(g).toFixed(1);return `<line x1="${padL}" y1="${y}" x2="${cw-padR}" y2="${y}" stroke="var(--line)" stroke-width=".6" stroke-dasharray="3,3"/><text x="${padL-4}" y="${+y+3}" text-anchor="end" font-size="7.5" fill="var(--ink3)">${g}</text>`;}).join('');
    const svg=`<svg viewBox="0 0 ${cw} ${chh}" style="width:100%;max-width:520px;display:block;margin:2px auto">${gridLines}<path d="${area}" fill="rgba(176,138,62,.10)" stroke="none"/>${xLabels}${dots}${hiTxt}<polyline points="${poly}" fill="none" stroke="var(--gold)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
    return `<div style="margin-bottom:10px;padding:9px 12px;background:var(--card2);border:1px solid var(--line);border-radius:8px">
      <div style="font-size:.78rem;color:var(--gold);margin-bottom:2px">📈 大运能量净值曲线 <span style="font-size:.64rem;color:var(--ink3);font-weight:400">（${strengthLabel(zh)}·${strengthAdvice(zh)} · 借鉴命格宇宙确定性推演）</span></div>
      ${svg}
      <div style="font-size:.66rem;color:var(--ink3);line-height:1.6">横轴为 ${dl.length} 步大运干支，纵轴为能量净值（0-100）。身强喜克泄耗（走财官食伤则分高）、身弱喜生扶（走印比则分高）；大运地支冲本命日支减分。高光大运：<b style="color:var(--gold)">${GAN[dl[hi].g]}${ZHI[dl[hi].z]}（${dl[hi].age}-${dl[hi].endAge}岁）</b>。此为基础五行生克倾向，非绝对定论。</div>
    </div>`;
  }catch(e){ return ''; }
}
/* ============ 过三关 · 断前事（验时辰） ============ */
// 盲派·刑冲穿害合会断事: 原局地支关系(zhGanZhiMap) → 宫位+关系 → 过去应验断语
function zhXingChong(zh){
  try{
    const rels=typeof zhGanZhiMap==='function'?zhGanZhiMap(zh):[];
    const zhiRels=rels.filter(r=>['地支六合','地支六冲','地支三合','地支相刑','地支自刑','地支六害','地支六破','地支暗合'].includes(r.t));
    if(!zhiRels.length) return [];
    const GONG_DESC={年:'祖辈家运（1-15岁）',月:'父母兄弟/青年（16-30岁）',日:'自身配偶（31-45岁）',时:'子女晚景（46岁后）'};
    const items=[];
    const relMsg={
      // 六冲: 冲者必动
      '子午相冲':'子午冲水火相战：一生多变动迁徙、心性易燥，或曾多次搬家换环境；心肾/血压易波动（养生注意）。',
      '丑未相冲':'丑未冲土气散：或与兄弟同辈聚少离多、小有不睦，或幼年祖业有变动；脾胃易不和。',
      '寅申相冲':'寅申冲金木相战：驿马奔波之象，学业事业期间多走动、出远门，或父亲常年在外；四肢劳损注意。',
      '卯酉相冲':'卯酉冲金木克：职业/居所多变更，或曾历血光小伤（手术/磕碰）；感情易有桃花纷争，肝胆肺注意。',
      '辰戌相冲':'辰戌冲库门开：家中或曾有大额开销/破耗、长辈为库财操劳；防斗讼口舌。',
      '巳亥相冲':'巳亥冲主变迁：变动搬迁之事多，头面小恙/神经紧张注意。',
      // 六害(穿): 穿的力量大于冲, 主暗损
      '子未相害':'子未穿（盲派极重"穿"）：主暗中损耗、皮肤脾胃小恙；或与六亲有"骨肉分离"（远居/聚少）之象。',
      '丑午相害':'丑午穿：主心肺小恙、或长辈（尤其父亲）曾历突发之事；感情中有暗波。',
      '寅巳相害':'寅巳穿：防官非口舌、小人暗算，或曾因文书/合约之事费心。',
      '卯辰相害':'卯辰穿：主争斗是非；若穿及日支（夫妻宫），感情中易有争执闹离之考验。',
      '申亥相害':'申亥穿：主破财暗耗，或曾因合作/借贷损失，财来财去。',
      '酉戌相害':'酉戌穿：主病痛之象，或家中长辈身体欠安，呼吸道/皮肤注意。',
      // 六破
      '子酉相破':'子酉破：主小损小耗，计划易中途生变。',
      '午卯相破':'午卯破：主感情/合作有裂痕之象，或曾历短暂分合。',
      '寅亥相破':'寅亥破：主计划受挫、小破财，或曾半途而废之事。',
      '巳申相破':'巳申破：主合中带破，合作/合伙之事易生变数。',
      '辰丑相破':'辰丑破：主暗中损耗、积蓄难聚，或为家宅之事费钱。',
      '戌未相破':'戌未破：主兄弟/同辈间有小破耗，或约定易变。',
      // 六合: 合者必牵
      '子丑合土':'子丑合：人缘助力、得长辈帮扶之象，幼年家宅安稳。',
      '寅亥合木':'寅亥合：智谋合作之象，朋友/同辈中多有助力者。',
      '卯戌合火':'卯戌合：事业显威权之象，青年期易遇提携之人。',
      '辰酉合金':'辰酉合：富贵之合，财路/贵人缘佳，合作易成。',
      '巳申合水':'巳申合：主流动奔波中的机遇，工作多地走动。',
      '午未合土':'午未合：稳根基之合，家庭/感情较安稳。',
      // 三合
      '申子辰合水':'三合水局：智慧流转变动之象，团队协作得力。',
      '亥卯未合木':'三合木局：仁德人缘之象，朋友帮衬多。',
      '寅午戌合火':'三合火局：事业显达之象，青年期易有平台/贵人。',
      '巳酉丑合金':'三合金局：刚毅果决之象，专业/技术领域易成。',
      // 三刑
      '寅巳申三刑':'寅巳申无恩刑：防官司口舌、恩将仇报之事；伤灾注意。',
      '丑戌未三刑':'丑戌未恃势刑：主财产纷争、仗势之事，或与亲属有利益纠纷。',
      '子卯相刑':'子卯无礼刑：主婚姻口舌、尊卑不分，感情中易有言语冲突。',
      '辰辰自刑':'辰辰自刑：自我纠结、反复内耗，或曾因犹豫错失机会。',
      '午午自刑':'午午自刑：心性急躁易内耗，或曾因冲动生事。',
      '酉酉自刑':'酉酉自刑：自我苛责、求全责备，或曾自我较劲。',
      '亥亥自刑':'亥亥自刑：思虑过重、优柔寡断，或曾因多虑误事。',
      // 暗合
      '暗合':'暗合主暗缘：人际中有隐性助力或暗中的合作/情缘，表面看不明显。'
    };
    const clsMain={chong:'【盲派·六冲】',he:'【盲派·六合】',sanhe:'【盲派·三合】',xing:'【盲派·三刑】',hai:'【盲派·六害(穿)】',po:'【盲派·六破】',anhe:'【盲派·暗合】'};
    zhiRels.forEach(r=>{
      const fromTo=String(r.from)+String(r.to||'');
      let gs=[];
      ['年','月','日','时'].forEach(g=>{ if(fromTo.includes(g)&&!gs.includes(g)) gs.push(g); });
      if(!gs.length){
        const chars=(String(r.from)+String(r.to||'')).split('').filter(c=>ZHI.includes(c));
        chars.forEach(c=>{
          const zi=ZHI.indexOf(c);
          if(zh.yearGZ[1]===zi&&!gs.includes('年')) gs.push('年');
          else if(zh.monthGZ[1]===zi&&!gs.includes('月')) gs.push('月');
          else if(zh.dayGZ[1]===zi&&!gs.includes('日')) gs.push('日');
          else if(zh.hourGZ[1]===zi&&!gs.includes('时')) gs.push('时');
        });
      }
      const nm=String(r.name||'');
      let msg=null;
      if(relMsg[nm]) msg=relMsg[nm];
      else{
        const hit=Object.keys(relMsg).find(k=>k!=='暗合'&&k!=='三合'&&nm.includes(k));
        if(hit) msg=relMsg[hit];
      }
      if(!msg){
        if(r.cls==='sanhe') msg='三合聚势：团队/贵人/行业合力之象，做事有帮衬'+(nm.includes('全')?'，三合全成局主贵':'，半合亦有助力');
        else if(r.cls==='anhe') msg='暗合主暗缘：人际中隐性助力或暗中的合作/情缘';
        else if(r.cls==='chong') msg='地支相冲主"动"：对应宫位之事多变动、搬迁分离、聚少离多';
        else if(r.cls==='he') msg='六合主"聚"：人缘助力、合作缘分、婚恋机缘，合入日支尤利夫妻';
        else if(r.cls==='hai') msg='六害(穿)主"暗损"：防小人暗算、暗中损耗、关系暗伤；盲派极重此象';
        else if(r.cls==='po') msg='六破主"损耗"：防破财、关系裂痕、计划受阻';
        else if(r.cls==='xing') msg='三刑主"是非伤病"：防口舌官非、意外伤病、自我内耗';
      }
      if(msg){
        const gongTxt=gs.length?'涉及【'+gs.map(g=>GONG_DESC[g]).join('、')+'】':'';
        items.push([(clsMain[r.cls]||'【盲派】')+(gs.length?'·'+gs.map(g=>g+'宫').join(''):''),nm+(gongTxt?'（'+gongTxt+'）':'')+'：'+msg]);
      }
    });
    return items;
  }catch(e){ return []; }
}
// 本地命理引擎: 按命盘反推过去应验之事, 供用户核对时辰是否准确
function zhGuoSanGuan(zh){
  const d=zh;
  const items=[];
  const hz=d.hourGZ[1];
  const HOUR12=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  // ===== 验时关: 12时辰逐时细化(过三关核心, 差异最大化) =====
  const hzTxt={
    0:'子时（23-1点）生，头脑机敏、心思细腻，幼年多亲近母亲、与父亲相对疏离；早年劳碌，中年后运势渐开。若您夜间精神好、少年多思虑，则子时较吻合。',
    1:'丑时（1-3点）生，性情坚韧、吃苦耐劳，幼年家中长辈操劳，多由祖辈带大或照看；中年后渐入佳境。若您自小独立性强、不爱诉苦，则丑时较吻合。',
    2:'寅时（3-5点）生，胆大敢闯、行动力强，幼年多有离家/外出经历，或父亲常年在外；一生易白手起家。若您胆子大、坐不住、爱往外跑，则寅时较吻合。',
    3:'卯时（5-7点）生，相貌端正、人缘好，幼年得母亲疼爱、家庭气氛和睦，做事有条理。若您面容端正、长辈缘好，则卯时较吻合。',
    4:'辰时（7-9点）生，聪明能干、自尊心强，幼年家境普通但家人重视教育，早年辛苦、中年后见好。若您好强、读书用心，则辰时较吻合。',
    5:'巳时（9-11点）生，机灵善谋、反应快，幼年变动多或家中常有客人来往；一生机会多但易虎头蛇尾。若您点子多、兴趣广，则巳时较吻合。',
    6:'午时（11-13点）生，热情开朗、事业心强，幼年受宠、性格外向、朋友多。若您性格外放、闲不住，则午时较吻合。',
    7:'未时（13-15点）生，温顺有耐心、人缘好，幼年家庭和睦、与长辈关系好，中年后生活平稳。若您性格温和、好相处，则未时较吻合。',
    8:'申时（15-17点）生，聪明好动、动手能力强，幼年贪玩但学东西快，或家中与"手艺/机械/交通"有缘；一生宜凭专业技能立身。若您动手能力强、爱好广，则申时较吻合。',
    9:'酉时（17-19点）生，秀气重情、多才多艺，幼年相貌出众、异性缘早显，感情细腻。若您注重仪表、心思细，则酉时较吻合。',
    10:'戌时（19-21点）生，忠诚稳重、外冷内热，幼年家教较严或父亲威严，做事有始有终。若您稳重、讲义气，则戌时较吻合。',
    11:'亥时（21-23点）生，心善随和、多思虑，幼年与母亲缘深、心思敏感，一生贵人暗助但易犹豫。若您心软、想得多，则亥时较吻合。'
  };
  if(hzTxt[hz]) items.push(['【验时·'+HOUR12[hz]+'时特征】',hzTxt[hz]]);
  // 验时·身体关: 时辰支五行 → 体质倾向
  const hzWx=ZHI_WX[hz];
  const bodyMap={0:'木：肝胆、筋脉、眼目——幼年注意用眼/视力，情绪易起伏，喜舒展运动',1:'火：心、小肠、血液循环——注意睡眠、上火，精力旺但易疲劳',2:'土：脾胃、消化——注意饮食规律，肠胃偏敏感',3:'金：肺、呼吸道、皮肤——注意过敏/咳嗽，皮肤偏敏感',4:'水：肾、泌尿、精力——注意腰部、精力，宜早睡养肾'};
  items.push(['【验时·身体关】','时支'+HOUR12[hz]+'属'+['木','火','土','金','水'][hzWx]+'：'+bodyMap[hzWx]+'。此为体质倾向，仅供养生参考。']);
  // ===== 第一关·命: 本人 =====
  // 幼年·祖辈(年柱十神)
  const yTS=tenGod(d.dg,d.yearGZ[0]);
  const yTxt={
    0:'幼年玩伴/同辈多，或与堂表亲一同长大，父母为家计操劳、陪伴时间相对有限。',
    1:'幼年同辈竞争多，或家中曾有破耗，父亲为财操劳。',
    2:'幼年乖巧有口福，长辈（尤其祖母）疼爱，家庭氛围宽松。',
    3:'幼年活泼好动、话多想法多，曾因淘气挨过管教。',
    4:'幼年家中经济不算宽裕，长辈为钱奔波，或见过大额开销。',
    5:'幼年家境尚可、饮食无忧，长辈勤俭持家、重传统。',
    6:'幼年家教偏严、规矩多，长辈权威感强，或年幼时体弱多病。',
    7:'幼年受规范约束多，长辈（尤其父亲）正直严格，家中秩序感强。',
    8:'幼年与母亲/长辈缘分深，性格早熟、心思细，读书偏科或喜欢偏门知识。',
    9:'幼年受母亲/长辈照拂多，聪慧好学、读书顺遂，家中重文教。'
  }[yTS]||'';
  if(yTxt) items.push(['【命关·幼年祖辈（1-12岁）】','年柱透'+SHISHEN_NAME[yTS]+'：'+yTxt]);
  // 父母(月柱十神)
  const yueTS=tenGod(d.dg,d.monthGZ[0]);
  const yueTxt={
    8:'父母重视教育、管教有方，与母亲关系亲近，家中重文',
    9:'父母宽厚、以培养子女为先，家庭氛围温暖',
    4:'父母务实操劳、为钱奔波，家中经济观念强',
    5:'父母勤俭持家、传统顾家，家庭生活稳定',
    6:'父母（尤其父亲）威严、管教严格，或有远行/聚少离多',
    7:'父母正直守规、家教严肃，家中规矩多',
    2:'父母开明随和、不苛求，家庭气氛轻松',
    3:'父母个性强、好胜心重，或家中长辈有能人',
    0:'父母同辈亲戚往来多，或非独生子女家庭',
    1:'父母为兄弟/同辈之事操心，家中开销较大'
  }[yueTS]||'';
  if(yueTxt) items.push(['【命关·父母（月柱）】','月柱透'+SHISHEN_NAME[yueTS]+'：'+yueTxt+'。']);
  // 早年年运(第一步大运)
  const dy0=d.dy&&d.dy.dyList[0];
  if(dy0){
    const t0=tenGod(d.dg,dy0.g);
    const zaoMap={
      8:'早年受长辈荫庇、读书启蒙顺，家人重视培养',
      9:'早年家庭安稳、学业起步稳，母缘深',
      2:'早年乖巧听话、受宠爱，无忧无虑',
      3:'早年活泼好动、成绩起伏，家人为学业操心',
      4:'早年家中为财操劳，或见过经济变动',
      5:'早年生活平顺、饮食无忧，家人务实',
      6:'早年体弱多病或家教严，幼年管束多',
      7:'早年规矩约束多、懂事早',
      0:'早年玩伴多、调皮，或与兄弟争宠',
      1:'早年同辈竞争多、开销大'
    };
    if(zaoMap[t0]) items.push(['【命关·早年年运（'+dy0.age+'-'+(dy0.age+9)+'岁）】','第一步大运走'+SHISHEN_NAME[t0]+'：'+zaoMap[t0]+'。']);
  }
  // 学业(第二步大运, 实际年龄段)
  const dy1=d.dy&&d.dy.dyList[1];
  if(dy1){
    const a1=dy1.age+'-'+(dy1.age+9);
    const t1=tenGod(d.dg,dy1.g);
    let x='第二步大运走'+SHISHEN_NAME[t1]+'：';
    if([8,9].includes(t1)) x+=a1+'岁学业偏顺、受师长喜欢，升学较顺';
    else if([2,3].includes(t1)) x+=a1+'岁聪明但心性活跃，成绩起伏或偏科，靠临场发挥';
    else if([6,7].includes(t1)) x+=a1+'岁学业压力大、规矩约束多，或读书阶段担任过班干部';
    else if([4,5].includes(t1)) x+=a1+'岁较早接触社会或兼职，学业与兴趣兼顾';
    else x+=a1+'岁同学朋友多，学业中游靠同伴互助';
    items.push(['【命关·学业（'+a1+'岁）】',x+'。']);
  }
  // ===== 第二关·财: 事业财运 =====
  // 青年事业财(第三步大运, 实际年龄段)
  const dy2=d.dy&&d.dy.dyList[2];
  if(dy2){
    const a2=dy2.age+'-'+(dy2.age+9);
    const t2=tenGod(d.dg,dy2.g);
    const map={
      0:'竞争多、合伙或与人共事，钱来钱去，宜守不宜攻',
      1:'防朋友借贷、合作分利之事，财来财去明显',
      4:'财运有起伏，副业/非主业易得财，或有意外收入',
      5:'财运渐稳，凭正职收入，开始有积蓄',
      6:'事业压力大、变动多，换过工作或环境变动，劳心费力',
      7:'事业走上正轨，有升职/考编/进大平台之象，贵人提携',
      8:'偏门技能/副业/考证进修之事多',
      9:'有进修、考证、贵人扶持之象，工作稳定',
      2:'以才艺/专业技能立身，做事顺遂，或创业之始',
      3:'个性张扬、变动多，或换行、创业，防口舌是非'
    };
    if(map[t2]) items.push(['【财关·青年事业财（'+a2+'岁）】','第三步大运走'+SHISHEN_NAME[t2]+'：'+map[t2]+'。']);
  }
  // 中年财运(第四步大运, 实际年龄段)
  const dy3=d.dy&&d.dy.dyList[3];
  if(dy3){
    const a3=dy3.age+'-'+(dy3.age+9);
    const t3=tenGod(d.dg,dy3.g);
    const map3={
      4:'中年财运上升，投资/经营渐有积累，防贪大',
      5:'中年正财渐稳，家庭开支大、储蓄渐增',
      6:'中年事业压力与责任加重，或晋升/担纲要职',
      7:'中年事业稳定上升，口碑与地位渐立',
      8:'中年钻研专业/考证/副业，凭积累见长',
      9:'中年贵人扶持、事业平台更稳',
      2:'中年以专业技能/作品立足，收入渐宽',
      3:'中年变动或挑战多，宜守不宜激进',
      0:'中年竞争多、合伙易有分利之争',
      1:'中年防合作破耗、借贷纠纷'
    };
    if(map3[t3]) items.push(['【财关·中年财运（'+a3+'岁）】','第四步大运走'+SHISHEN_NAME[t3]+'：'+map3[t3]+'。']);
  }
  // 行业倾向(最旺十神)
  const tsMax=d.tsCount.indexOf(Math.max(...d.tsCount));
  const hyMap={
    0:'比劫旺：适合合伙、竞争型/运动/销售行业，人多场合发挥好',
    1:'劫财旺：适合流通/中介/快消行业，忌长期守财型工作',
    2:'食神旺：适合餐饮/艺术/教育/口才类行业',
    3:'伤官旺：适合创意/技术/设计/自媒体类行业',
    4:'偏财旺：适合商贸/投资/灵活经营类行业',
    5:'正财旺：适合财务/金融/稳定实业类行业',
    6:'七杀旺：适合管理/军警/竞争性强的行业',
    7:'正官旺：适合体制/管理/规模型平台',
    8:'偏印旺：适合学术/研究/偏门专业类',
    9:'正印旺：适合文教/医疗/公共事业类'
  };
  if(hyMap[tsMax]) items.push(['【财关·行业倾向】','命局以'+SHISHEN_NAME[tsMax]+'最旺：'+hyMap[tsMax]+'。此为倾向参考。']);
  // ===== 盲派·刑冲穿害合会(断事核心) =====
  const xcItems=zhXingChong(zh);
  items.push.apply(items,xcItems);
  // ===== 第三关·婚: 婚恋感情 =====
  // 配偶类型(配偶宫日支本气藏干十神: 原误用日支索引当天干导致坐比劫)
  const fqTS=tenGod(d.dg,ZHI_HIDDEN[d.dayGZ[1]][0]);
  const fqMap={
    6:'配偶有主见、管束型，感情中对方较强势，晚婚或经人介绍概率较高',
    7:'配偶正直稳重、重规矩，感情严肃认真，经长辈/领导介绍可能较大',
    4:'配偶经济观念强、会持家，感情中财务话题较多',
    5:'配偶顾家务实、传统，感情稳定',
    8:'配偶体贴细心或聚少离多，感情中对方付出感强',
    9:'配偶温厚包容、像长辈般照顾，或经长辈撮合',
    2:'配偶随和好相处、话多，感情轻松有趣',
    3:'配偶个性强、有话直说，感情中磨合较多',
    0:'配偶朋友多、人缘好，感情中或有竞争者需留意',
    1:'配偶重义气、开销大，感情中财务需共同规划'
  };
  items.push(['【婚关·配偶类型】','日支（配偶宫）坐'+SHISHEN_NAME[fqTS]+'：'+(fqMap[fqTS]||'配偶缘分稳定')+'。']);
  // 桃花
  if(d.taoHua>=0){
    const huaGong=(d.taoHua===d.yearGZ[1]?'年柱(幼年早熟/早恋倾向)':d.taoHua===d.monthGZ[1]?'月柱(青年桃花旺/人缘好)':d.taoHua===d.dayGZ[1]?'日支(婚后桃花，夫妻情深)':d.taoHua===d.hourGZ[1]?'时柱(中年后桃花/子女缘相关)':'四柱外');
    items.push(['【婚关·桃花】','命带桃花（'+ZHI[d.taoHua]+'，落'+huaGong+'）：异性缘'+(d.taoHua===d.dayGZ[1]?'佳且利夫妻感情':'较旺，注意把握分寸')+'。']);
  }
  // 适婚段(男看财女看官, 找大运)
  const peiOuXing=d.gender===1?[4,5]:[6,7];
  let hunQi='';
  if(d.dy&&d.dy.dyList){
    const hit=d.dy.dyList.slice(0,5).find(dy=>peiOuXing.includes(tenGod(d.dg,dy.g)));
    if(hit) hunQi='适婚机缘集中在约'+hit.age+'-'+(hit.age+9)+'岁（'+SHISHEN_NAME[tenGod(d.dg,hit.g)]+'大运），该段感情/婚姻机会最明显';
    else hunQi='缘分多在中晚段，宜顺其自然、长辈介绍较佳';
  }
  items.push(['【婚关·姻缘时机】',hunQi+'。']);
  // 子女(时柱十神)
  const shiTS=tenGod(d.dg,d.hourGZ[0]);
  const ziTxt={
    2:'子女聪慧活泼、缘分好，与子女相处轻松',
    3:'子女有个性、聪明外露，教育上需多引导',
    8:'子女缘细水长流，或得子较晚、子女体贴',
    9:'子女温顺依赖、有书缘，宜重培养',
    6:'子女自律有出息，但管教需注意方式',
    7:'子女守规矩、上进，亲子关系偏严肃',
    4:'子女缘一般，为子女操心财务，或子女务实',
    5:'子女传统孝顺，家庭观念强',
    0:'子女缘随和，或子女朋友多',
    1:'子女开销大、需多规划'
  };
  if(ziTxt[shiTS]) items.push(['【婚关·子女（时柱）】','时柱透'+SHISHEN_NAME[shiTS]+'：'+ziTxt[shiTS]+'。']);
  // ===== 收尾: 健康与性格总断 =====
  const wxNames=['木','火','土','金','水'];
  const maxWx=wxNames[d.wxCount.indexOf(Math.max(...d.wxCount))];
  const minWx=wxNames[d.wxCount.indexOf(Math.min(...d.wxCount))];
  const wxHealth={木:'肝胆、筋脉（注意情绪波动、用眼疲劳）',火:'心脑血管、睡眠（注意上火、失眠）',土:'脾胃消化（注意饮食不节）',金:'肺呼吸道、皮肤（注意过敏、呼吸道）',水:'肾膀胱、泌尿（注意腰部、精力）'};
  items.push(['【命关·健康体质】','五行以'+maxWx+'最旺、'+minWx+'最弱：旺者防'+wxHealth[maxWx]+'，弱者宜补养'+wxHealth[minWx]+'。此为体质倾向，不作医疗诊断。']);
  const strongTxt=strengthLabel(d);
  items.push(['【命关·性格总断】','日主'+GAN[d.dg]+'、'+strongTxt+'（用神'+(typeof d.yongShen==='number'?['木','火','土','金','水'][d.yongShen]:'见下方分析')+'）：'+(strengthText(d,'行事有主见、能扛事，但易固执、爱面子，宜学柔和','心思细、善借力、随和，但易犹豫、缺决断，宜学果断'))+'。']);
  return items;
}
// 断前事勾选交互: 点击断语标记符合/不符, 实时算时辰匹配度
function gsgToggle(el){
  const ok=el.dataset.ok==='1'?0:1;
  el.dataset.ok=ok;
  const mk=el.querySelector('.gsg-mark');
  if(mk){ mk.textContent=ok?'✓':'☐'; mk.style.color=ok?'var(--jade)':'var(--ink3)'; }
  el.style.borderLeftColor=ok?'var(--jade)':'var(--orange)';
  el.style.background=ok?'rgba(74,122,114,.08)':'var(--card2)';
  updateGsgScore();
}
function updateGsgScore(){
  const box=document.getElementById('zh-gsg');
  if(!box) return;
  const items=box.querySelectorAll('.gsg-item');
  const ok=box.querySelectorAll('.gsg-item[data-ok="1"]').length;
  const el=document.getElementById('zh-gsg-score');
  if(!el||!items.length) return;
  const pct=Math.round(ok/items.length*100);
  const verdict=pct>=70?'时辰匹配度很高，时辰大概率无误':pct>=40?'时辰匹配度中等，建议改用相邻时辰对比一次':'时辰匹配度偏低，强烈建议试相邻时辰';
  el.innerHTML='已核对 <b style="color:var(--jade)">'+ok+'</b>/'+items.length+' 条符合 · 时辰匹配度 <b style="color:'+(pct>=70?'var(--jade)':pct>=40?'var(--orange)':'var(--red)')+'">'+pct+'%</b>（'+verdict+'）';
}
function zhConfirmPast(){
  const el=document.getElementById('zh-gsg');
  if(!el) return;
  el.innerHTML='<div style="color:var(--jade);font-size:.76rem;padding:4px 2px">✓ 已确认时辰正确，请继续查看下方完整命盘（如需重新核对，重新排盘即可）。</div>';
}
function zhSkipPast(){
  const el=document.getElementById('zh-gsg');
  if(el) el.style.display='none';
}
function zhChangeHourHint(){
  alert('请在上方「出生时辰」处改为相邻时辰（前后各试一个），重新排盘后再次核对断前事——前后两个时辰的断语差异会很明显，选匹配度高的那个即可。');
  const h=document.getElementById('zh-hour');
  if(h){ h.focus(); if(h.scrollIntoView) h.scrollIntoView({behavior:'smooth',block:'center'}); }
}
function renderZongHe(zh,name){
  aiEvidenceLeave();
  const d=zh;
  let html=`<div class="result"><div class="result-title">综合命盘 · 五术同参 </div>`;
  html+=`<div class="info-bar">`;
  if(name)html+=`<span>姓名：<b>${esc0(name)}</b></span>`;
  html+=`<span>性别：<b>${genderLabel(d)}</b></span>`;
  html+=`<span>公历：<b>${d.date.getFullYear()}年${d.date.getMonth()+1}月${d.date.getDate()}日</b> ${HOUR_NAMES[d.hourIdx]}</span>`;
  html+=`<span>农历：<b>${d.lunar.year}年${d.lunar.isLeap?'闰':''}${lunarMonthName(d.lunar.month,d.lunar.isLeap)}${lunarDayName(d.lunar.day)}</b></span>`;
  html+=`<span>生肖：<b>${"鼠牛虎兔龙蛇马羊猴鸡狗猪"[d.yearGZ[1]]}</b></span>`;
  html+=`<span>节气：<b>${curTermName(d.temporal?.civilDate||d.zh?.temporal?.civilDate||d.date)}</b></span>`;
  html+=`<span>星座：<b>${getZodiac(d.date)}</b></span>`;
  html+=`<span>命卦：<b>${getMingGua(d.date.getFullYear(),d.gender)}</b></span></div>`;
  // 真太阳时/时辰不确定/节气临近提示
  const warnNotes=[];
  if(d.solarNote) warnNotes.push(d.solarNote);
  if(d.unknowHour) warnNotes.push('⚠️ 已勾选"时辰不确定"：时柱、子女宫、晚运及盲派应期断语仅供参考');
  if(typeof jieqiNearNote==='function'){
    const nearJQ=jieqiNearNote(d.temporal?.civilDate||d.date);
    if(nearJQ.length) warnNotes.push('⚠️ 出生时间临近【'+nearJQ.map(j=>j.name+'（'+j.diff+'天后）').join('、')+'】节气交接，月柱/年柱可能受影响，请核对出生时间');
  }
  if(warnNotes.length){
    html+=`<div style="background:rgba(200,122,45,.08);border:1px solid #c87a2d;border-radius:8px;padding:8px 12px;font-size:.74rem;color:var(--ink2);line-height:1.7;margin-bottom:12px">${warnNotes.map(esc0).join('<br>')}</div>`;
  }
  html+=renderRuleFacts(zh);
  // 分享操作栏
  html+=`<div style="display:flex;justify-content:center;gap:8px;margin:0 0 14px;flex-wrap:wrap"><button class="btn btn-ghost" onclick="shareCopy()" style="font-size:.78rem;padding:5px 16px"> 复制命盘摘要</button><button class="btn btn-ghost" onclick="window.print()" style="font-size:.78rem;padding:5px 16px"> 打印 / 存为PDF</button><button class="btn btn-ghost" onclick="exportChartPng()" style="font-size:.78rem;padding:5px 16px">📸 导出命盘图</button><button class="btn btn-ghost" onclick="exportRecords()" style="font-size:.78rem;padding:5px 16px">💾 导出备份</button><button class="btn btn-ghost" onclick="document.getElementById('import-records-file').click()" style="font-size:.78rem;padding:5px 16px">📥 导入备份</button><input type="file" id="import-records-file" accept=".json" style="display:none" onchange="importRecords(this)"></div>`;
  html+=`<div class="sec-nav" id="zh-sec-nav"><button type="button" class="sec-nav-btn active" data-sec="1" onclick="zhSecGo(1)">命盘</button><button type="button" class="sec-nav-btn" data-sec="2" onclick="zhSecGo(2)">大运流年</button><button type="button" class="sec-nav-btn" data-sec="3" onclick="zhSecGo(3)">多维分析</button><button type="button" class="sec-nav-btn" data-sec="4" onclick="zhSecGo(4)">AI 解读</button></div>`;
  html+=`<div class="sec-page" id="zh-sec-1">`;
  // 过三关·断前事(验时辰): 勾选时置于P1顶部, 核对过去应验之事确认时辰
  let pastChecked=false;
  try{ pastChecked=document.getElementById('zh-check-past')&&document.getElementById('zh-check-past').checked; }catch(e){}
  if(pastChecked){
    const gsg=zhGuoSanGuan(zh);
    if(gsg.length){
      html+=`<div class="section-block" id="zh-gsg" style="border:1.5px solid var(--orange);background:linear-gradient(135deg,rgba(200,122,45,.06),rgba(176,138,62,.03))">
      <h3>🔮 过三关 · 断前事（验时辰）<span style="font-size:.68rem;color:var(--ink3);font-weight:400">（先核对过去应验之事，确认出生时辰无误后再看整体）</span></h3>
      <div style="font-size:.72rem;color:var(--ink2);line-height:1.7;margin-bottom:6px">共 <b>${gsg.length}</b> 条断语，按「验时 / 命关 / 财关 / 婚关」三关排列。<b>点击任意断语可标记符合✓/不符☐</b>，底部实时计算时辰匹配度——相符越多，时辰越准确。若匹配度偏低，请改用相邻时辰重排对比。</div>
      <div style="font-size:.8rem;font-weight:700;color:var(--jade);background:rgba(74,122,114,.1);border-radius:6px;padding:6px 10px;margin-bottom:8px" id="zh-gsg-score">已核对 0/${gsg.length} 条符合 · 时辰匹配度 <b>0%</b>（点击断语开始核对）</div>
      <div style="display:flex;flex-direction:column;gap:5px">`+gsg.map(it=>{
        const tag=it[0].replace(/[【】]/g,'');
        const cls=tag.startsWith('验时')?'var(--gold)':tag.startsWith('命关')?'var(--jade)':tag.startsWith('财关')?'var(--gold2)':'var(--purple)';
        return `<div class="gsg-item" onclick="gsgToggle(this)" data-ok="0" style="font-size:.76rem;line-height:1.65;padding:6px 10px;background:var(--card2);border-left:3px solid var(--orange);border-radius:6px;cursor:pointer;transition:all .15s"><span class="gsg-mark" style="color:var(--ink3);margin-right:5px">☐</span><b style="color:${cls}">${it[0]}</b> ${it[1]}</div>`;
      }).join('')+`</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn btn-primary" onclick="zhConfirmPast()" style="font-size:.78rem;padding:5px 14px">✓ 时辰正确 · 继续看整体</button>
        <button class="btn btn-ghost" onclick="zhChangeHourHint()" style="font-size:.78rem;padding:5px 14px">✗ 时辰不对 · 改时辰重排</button>
        <button class="btn btn-ghost" onclick="zhSkipPast()" style="font-size:.78rem;padding:5px 14px">跳过本部分</button>
      </div></div>`;
    }
  }
  // 四柱速览
  html+=`<div class="section-block"><h3>四柱命盘 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（点击十神/神煞查看详解 · 月柱含司令）</span></h3><div class="pillar-grid">`;
  d.pillars.forEach((gz,i)=>{
    const isSelf=i===2;
    const ts=isSelf?'日主':SHISHEN_NAME[tenGod(d.dg,gz[0])];
    const hd=zhiHiddenTs(d,gz[1]);
    const cs=getChangSheng(d.dg,gz[1]);
    const csCls=['长生','临官','帝旺'].includes(cs)?'color:var(--red)':'';
    const gCls=WUXING_CLS[WUXING[GAN_WX[gz[0]]]], zCls=WUXING_CLS[WUXING[ZHI_WX[gz[1]]]];
    const hdHtml=hd.map(x=>`${GAN[x.g]}<span style="color:var(--ink3)">${tterm(x.ts)}${x.r}%</span>`).join(' · ');
    const sl=typeof siLingInfo==='function'?siLingInfo(d.date,d.monthGZ[1]):null;
    const lingHtml=i===1&&sl?`<br>司令 <b style="color:var(--gold)">${GAN[sl.cur]}</b><span style="color:var(--ink3)">（节后${sl.pass}日）</span>`:'';
    html+=`<div class="pillar-card${isSelf?' self':''}"><div class="p-tag">${['年柱','月柱','日柱','时柱'][i]}</div><div class="p-gz"><span style="color:var(--c-${gCls})">${GAN[gz[0]]}</span><span class="z" style="color:var(--c-${zCls})">${ZHI[gz[1]]}</span></div><div class="p-ts">${tterm(ts)}</div><div class="p-detail">藏干 ${hdHtml}${lingHtml}<br>长生 <span style="${csCls}">${tterm(cs)}</span></div><div class="p-wx"><span style="color:var(--c-${gCls})">${WUXING[GAN_WX[gz[0]]]}</span>·<span style="color:var(--c-${zCls})">${WUXING[ZHI_WX[gz[1]]]}</span> <i>${NAYIN[nayinIndex(gz[0],gz[1])]}</i></div></div>`;
  });
  html+=`</div>`;
  // 五行能量图
  html+=`<div style="background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:14px 16px"><div style="font-size:.8rem;color:var(--ink2);letter-spacing:.15em;margin-bottom:8px">五行能量（个数与占比 · 圆大小=数量 · 金线相生/红虚线相克）</div>${typeof wxFlowSvg==='function'?wxFlowSvg(d):''}${wxBar(d.wxCount)}</div>`;
  // 六神配置(用神/喜神/忌神/仇神/闲神)
  const ls=zhLiuShen(d);
  const lsRows=[
    {role:'用神',w:ls.yong,desc:ls.roles.yong,color:'var(--gold)',bg:'rgba(176,138,62,.1)'},
    {role:'喜神',w:ls.xi,desc:ls.roles.xi,color:'var(--gold)',bg:'rgba(176,138,62,.07)'},
    {role:'忌神',w:ls.ji,desc:ls.roles.ji,color:'var(--red)',bg:'rgba(158,43,37,.07)'},
    {role:'仇神',w:ls.chou,desc:ls.roles.chou,color:'var(--red2)',bg:'rgba(122,32,28,.07)'}
  ];
  html+=`<div style="background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-top:10px"><div style="font-size:.8rem;color:var(--ink2);letter-spacing:.15em;margin-bottom:10px">⚔️ 喜用神阵营 · 喜用忌仇闲（${d.strengthType}，以${WUXING[ls.yong]}为用 · 主帅援军敌军粮草路人）</div>`;
  lsRows.forEach(r=>{
    html+=`<div style="display:flex;align-items:center;gap:10px;margin:5px 0;padding:6px 10px;background:${r.bg};border-radius:8px;border-left:3px solid ${r.color}"><span style="width:36px;font-size:.8rem;font-weight:700;color:${r.color}">${tterm(r.role)}</span><span style="font-size:.9rem;font-weight:700;color:${r.color}">${WUXING[r.w]||'—'}</span><span style="font-size:.72rem;color:var(--ink3)">${ls.count(r.w)||0}位</span><span style="font-size:.72rem;color:var(--ink2);flex:1">${r.desc}</span></div>`;
  });
  html+=`<div style="display:flex;align-items:center;gap:10px;margin:5px 0;padding:6px 10px;background:rgba(107,100,87,.06);border-radius:8px;border-left:3px solid var(--ink2)"><span style="width:36px;font-size:.8rem;font-weight:700;color:var(--ink2)">${tterm('闲神')}</span><span style="font-size:.9rem;font-weight:700;color:var(--ink2)">${ls.xian.map(w=>WUXING[w]).join('、')||'—'}</span><span style="font-size:.72rem;color:var(--ink3)">${ls.xian.map(w=>ls.count(w)+'位').join(' ')}</span><span style="font-size:.72rem;color:var(--ink2);flex:1">${ls.roles.xian} · 大运流年来才见真章</span></div>`;
  html+=`</div></div>`;
  // Presentation-only relation explorer; calculation results remain in zhGanZhiMap.
  html+=renderGanZhiRelations(d);
  // v3 命格总断卡 + 五维能量雷达(先总后分: 四柱既定先观命骨, 再展十神能量结构)
  html+=zhMingGeCard(d);
  html+=zhBirthPlace(d);
  html+=zhWuWeiRadar(d);
  // 紫微斗数参考(勾选"参考紫微斗数"时自动排盘展示,同源数据亦并入AI提示词)
  try{
    const zwRef=zhZwRefText(d);
    if(zwRef){
      html+=`<div class="section-block" style="border:1px dashed var(--gold2)"><h3>♈ 紫微斗数参考 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（自动排盘 · 已并入 AI 提示词，可在排盘表单取消勾选）</span></h3><div style="font-size:.78rem;color:var(--ink);line-height:2;white-space:pre-wrap">${zwRef.replace(/【紫微斗数参考】\n?/,'').split('\n').map(l=>l.trim()?('<div>'+l+'</div>'):'').join('')}</div></div>`;
    }
  }catch(e){}
  html+=`</div>`;
  html+=`<div class="sec-page" id="zh-sec-2" style="display:none">`;
  // 当前大运定位条(交替轨迹: 现在在哪步运 + 今年喜忌)
  const nowYr2=new Date().getFullYear();
  const birthYr2=d.date.getFullYear();
  const curDy2=d.dy.dyList.find(dy=>birthYr2+dy.age<=nowYr2&&nowYr2<=birthYr2+dy.endAge);
  const curLny2=((nowYr2-4)%60+60)%60, lg2=indexToGZ(curLny2);
  const lnGood2=(GAN_WX[lg2[0]]===d.yongShen||ZHI_WX[lg2[1]]===d.yongShen||GAN_WX[lg2[0]]===(d.yongShen+4)%5||ZHI_WX[lg2[1]]===(d.yongShen+4)%5);
  const lnBad2=(GAN_WX[lg2[0]]===(d.yongShen+3)%5||ZHI_WX[lg2[1]]===(d.yongShen+3)%5);
  if(curDy2){
    const nxt2=d.dy.dyList[d.dy.dyList.indexOf(curDy2)+1];
    const curCs2=getChangSheng(d.dg,curDy2.z);
    html+=`<div style="background:linear-gradient(135deg,rgba(176,138,62,.12),rgba(176,138,62,.03));border:1px solid var(--gold2);border-radius:12px;padding:12px 16px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;font-size:.8rem">
      <span style="font-weight:700;color:var(--gold);letter-spacing:.08em">📍 当前位置</span>
      <span>大运 <b style="font-size:1.02rem;color:var(--gold)">${GAN[curDy2.g]}${ZHI[curDy2.z]}</b><span style="color:var(--ink3)">（第${d.dy.dyList.indexOf(curDy2)+1}步 · ${SHISHEN_NAME[tenGod(d.dg,curDy2.g)]}·${curCs2} · ${birthYr2+curDy2.age}-${birthYr2+curDy2.endAge}）</span></span>
      <span>流年 <b style="font-size:1.02rem;color:${lnGood2?'var(--jade)':lnBad2?'var(--red)':'var(--ink2)'}">${nowYr2} ${GAN[lg2[0]]}${ZHI[lg2[1]]}</b> <span style="color:var(--ink3)">${SHISHEN_NAME[tenGod(d.dg,lg2[0])]}</span></span>
      <span style="color:${lnGood2?'var(--jade)':lnBad2?'var(--red)':'var(--ink2)'}">${lnGood2?'🌿 喜用之年 · 宜进取布局':lnBad2?'⚠️ 忌神之年 · 宜守成蓄力':'🕰️ 闲平之年 · 稳中求进'}</span>
      ${nxt2?`<span style="color:var(--ink3)">下一步 <b style="color:var(--ink)">${GAN[nxt2.g]}${ZHI[nxt2.z]}</b>（${birthYr2+nxt2.age}-${birthYr2+nxt2.endAge}）</span>`:''}
    </div>`;
  }
  // ===== 大运总览 + 断起运时间 =====
  try{
    const dyO=d.dy;
    if(dyO&&dyO.dyList&&dyO.dyList.length){
      const qyD=civilFromMillis(civilMillis(d.date));
      qyD.setMonth(qyD.getMonth()+dyO.startYears*12+dyO.startMonths);
      html+=`<div class="section-block"><h3>🛤️ 大运总览 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（8步大运 · ${dyO.forward?'阳男阴女顺排':'阴男阳女逆排'}）</span></h3>`;
      html+=zhDayunCurve(d);
      html+=`<div style="font-size:.76rem;color:var(--ink2);line-height:1.9;margin-bottom:8px;padding:9px 12px;background:var(--card2);border:1px solid var(--line);border-radius:8px"><b style="color:var(--gold)">⏱ 起运时间</b>：${dyO.startYears}岁${dyO.startMonths}个月（约 ${dyO.startAge} 岁起运）· ${dyO.forward?'阳男阴女顺行':'阴男阳女逆行'}排运 · 出生距换月节气 <b>${dyO.days} 天</b>（三天折一岁、一天折四月）。<br><b style="color:var(--gold)">🕐 交运公历</b>：约 ${qyD.getFullYear()} 年 ${qyD.getMonth()+1} 月交运（出生 ${d.date.getFullYear()}年${d.date.getMonth()+1}月${d.date.getDate()}日 + ${dyO.startYears}年${dyO.startMonths}个月），大运逢"节"而换。</div>`;
      html+=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.75rem"><thead><tr style="color:var(--ink3);background:var(--card2)"><th style="padding:6px 4px;border:1px solid var(--line);text-align:center">步</th><th style="padding:6px 4px;border:1px solid var(--line);text-align:center">大运干支</th><th style="padding:6px 4px;border:1px solid var(--line);text-align:center">十神</th><th style="padding:6px 4px;border:1px solid var(--line);text-align:center">长生</th><th style="padding:6px 4px;border:1px solid var(--line);text-align:center">纳音</th><th style="padding:6px 4px;border:1px solid var(--line);text-align:center">公历年龄</th></tr></thead><tbody>`;
      dyO.dyList.forEach((x,i)=>{
        const isCur=nowYr2>=birthYr2+x.age&&nowYr2<=birthYr2+x.endAge;
        const ts=SHISHEN_NAME[tenGod(d.dg,x.g)];
        const cs=getChangSheng(d.dg,x.z);
        const csCls=['长生','临官','帝旺'].includes(cs)?'color:var(--red);font-weight:600':'';
        html+=`<tr style="${isCur?'background:rgba(176,138,62,.10);':''}border-bottom:1px solid var(--line)"><td style="padding:6px 4px;border:1px solid var(--line);text-align:center;color:var(--ink3)">${i+1}${isCur?'·今':''}</td><td style="padding:6px 4px;border:1px solid var(--line);text-align:center;font-family:'Noto Serif SC',serif;font-weight:700;font-size:.88rem;color:var(--gold)">${GAN[x.g]}${ZHI[x.z]}</td><td style="padding:6px 4px;border:1px solid var(--line);text-align:center">${ts}</td><td style="padding:6px 4px;border:1px solid var(--line);text-align:center;${csCls}">${cs}</td><td style="padding:6px 4px;border:1px solid var(--line);text-align:center;color:var(--ink3)">${x.nayin}</td><td style="padding:6px 4px;border:1px solid var(--line);text-align:center">${birthYr2+x.age}-${birthYr2+x.endAge}</td></tr>`;
      });
      html+=`</tbody></table></div></div>`;
    }
  }catch(e){}
  // 流年流月
  const lyr=getYearGZ(new Date());
  const lyMonths=getLiuYue(lyr[0],12);
  const nowY=new Date().getFullYear();
  html+=`<div style="background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-top:10px"><div style="font-size:.8rem;color:var(--ink2);letter-spacing:.15em;margin-bottom:10px">${nowY}年 流年流月</div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">`;
  lyMonths.forEach((m,i)=>{
    const tg=tenGod(d.dg,m.g);
    const isGood=GAN_WX[m.g]===d.yongShen||ZHI_WX[m.z]===d.yongShen;
    html+=`<div style="background:var(--card);border:1px solid ${isGood?'var(--gold)':'var(--line)'};border-radius:10px;padding:7px 4px;text-align:center"><div style="font-size:.68rem;color:var(--ink3)">${lunarMonthName(i+1,false)}</div><div style="font-size:.9rem;font-family:'Noto Serif SC',serif;font-weight:700;color:${isGood?'var(--gold)':'var(--ink)'}">${GAN[m.g]}${ZHI[m.z]}</div><div style="font-size:.66rem;color:var(--ink3)">${SHISHEN_NAME[tg]}${isGood?'·吉':''}</div></div>`;
  });
  html+=`</div></div>`;
  // 流年时间轴(紧凑横向滚动版, 点击卡片查看该年详情)
  const tl=zhLiuNianTimeline(zh);
  try{window._tlData=tl;}catch(e){}
  const tagColor={'喜用':'var(--jade)','忌神':'var(--red)','平':'var(--gold2)','平运':'var(--ink3)','财富':'var(--gold)','事业':'var(--purple)','学业':'var(--blue)','才华/子女':'var(--pink)','人际/竞争':'var(--teal)','婚姻':'var(--red)','变动':'var(--orange)','健康':'var(--green)'};
  const kindStyle={'喜用':{label:'喜用',color:'var(--jade)',bg:'rgba(45,140,120,.10)'},'平':{label:'闲平',color:'var(--gold2)',bg:'rgba(107,100,87,.05)'},'忌神':{label:'忌神',color:'var(--red)',bg:'rgba(158,43,37,.08)'}};
  html+=`<div class="section-block"><h3>📅 流年时间轴 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（过去5年 · 未来15年 · 点击年份卡片查看该年详情）</span></h3>`;
  html+=`<div style="font-size:.68rem;color:var(--ink2);margin-bottom:8px;line-height:1.7">📖 典籍对照：<b>喜用神阵营</b>断流年——《滴天髓》『财气通门户』喜用之年宜进取；《子平真诠》『忌神制化则吉』忌神之年宜守成；《渊海子平》太岁引动原局（合/冲/刑/害）即应期，冲强刑害次之合缓。<span style="color:var(--ink3)">●喜用 ●闲平 ●忌神</span></div>`;
  html+=`<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px">`;
  tl.forEach(fy=>{
    const isNow=fy.y===new Date().getFullYear();
    const col=fy.good?'var(--jade)':fy.bad?'var(--red)':'var(--ink2)';
    const ks=kindStyle[fy.kind]||kindStyle['平'];
    const relShort=fy.rels.slice(0,2).map(r=>r.name+(r.pillar)).join(' ');
    html+=`<div data-year="${fy.y}" onclick="tlSelect(${fy.y})" style="flex:0 0 auto;min-width:86px;max-width:86px;text-align:center;background:${ks.bg};border:1px solid ${col};border-radius:9px;padding:6px 3px;cursor:pointer;position:relative;transition:transform .2s,box-shadow .2s;${isNow?'box-shadow:0 0 0 2px var(--gold2);':''}">
      <div style="font-size:.6rem;color:var(--ink3)">${fy.y}${isNow?'·今':''}</div>
      <div style="font-size:.98rem;font-weight:700;color:${col};font-family:'Noto Serif SC',serif">${GAN[fy.g]}${ZHI[fy.z]}</div>
      <div style="font-size:.56rem;color:var(--ink3);margin:1px 0;line-height:1.4">干 ${tterm(fy.tgName)}<br><span style="color:var(--gold2)">支 ${tterm(fy.tzName)}</span></div>
      <div style="display:flex;justify-content:center;gap:3px;margin:2px 0"><span style="font-size:.52rem;padding:0 4px;border-radius:6px;color:#fff;background:${ks.color}">${ks.label}</span><span style="font-size:.52rem;padding:0 4px;border-radius:6px;color:#fff;background:${fy.strong==='强'?'var(--red)':fy.strong==='中'?'var(--orange)':'var(--ink3)'}">${fy.strong}</span></div>
      <div style="font-size:.56rem;color:var(--ink2);line-height:1.4;min-height:2em">${relShort||'—'}</div>
    </div>`;
  });
  html+=`</div>`;
  // 点击详情条(初始显示当前年)
  html+=`<div id="tl-detail-box" style="margin-top:10px;border:1px solid var(--gold2);border-radius:10px;padding:12px 14px;background:var(--card2)"></div>`;
  html+=`<div style="margin-top:4px;font-size:.66rem;color:var(--ink3)">⚠️ 喜忌标记与应期强度为传统命理倾向，仅供自我参考；喜用年进取、忌神年守成，人生选择仍以现实为准。</div>`;
  // 🤖 AI 大运深度解读区(接住 AI 的【14】大运总览输出, 与流年解读呼应)
  html+=`<div id="ai-dayun-detail" style="display:none;margin-top:14px;padding:14px 16px;background:var(--card2);border:1px solid var(--purple);border-radius:10px"><div style="font-size:.78rem;color:var(--purple);font-weight:700;margin-bottom:8px">🤖 AI 大运深度解读 <span style="font-size:.66rem;color:var(--ink3);font-weight:400">（起运岁数·当前大运·下一步·各步主题）</span></div><div class="ai-dayun-body" style="font-size:.76rem;line-height:1.8;color:var(--ink)"></div></div>`;
  // 🤖 AI 流年深度解读区(接住 AI 的【15】流年应期输出,按 21 年展开,避免上方紧凑卡片过干)
  html+=`<div id="ai-liunian-detail" style="display:none;margin-top:14px;padding:14px 16px;background:var(--card2);border:1px solid var(--jade);border-radius:10px"><div style="font-size:.78rem;color:var(--jade);font-weight:700;margin-bottom:8px">🤖 AI 流年深度解读 <span style="font-size:.66rem;color:var(--ink3);font-weight:400">（按21年逐年·悬停时间轴卡片查看对应年份）</span></div><div class="ai-liunian-body" style="font-size:.76rem;line-height:1.8;color:var(--ink)"></div></div>`;
  html+=`</div>`;
  html+=`</div>`;
  html+=`<div class="sec-page" id="zh-sec-3" style="display:none">`;
  // 流派对照(4大主流+综合)
  const contrast=zhSchoolContrast(zh);
  html+=`<div class="section-block" style="border:1px solid var(--purple)"><h3>🧭 流派对照 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（同一命局 · 四大主流派视角 · 侧重点不同结论可能不一致）</span></h3>`;
  html+=`<div style="font-size:.72rem;color:var(--ink2);margin-bottom:10px;padding:8px 10px;background:rgba(107,100,87,.06);border-radius:8px">🔍 四大流派切入角度各异：<b>旺衰派</b>看能量强弱与喜用补益 · <b>子平格局派</b>看月令格局与事业结构 · <b>盲派</b>看做功主宾与事件应期 · <b>调候派</b>看寒暖气候与气质健康——结论互为印证、各有侧重，综合看更有参考价值。</div>`;
  contrast.forEach((c,i)=>{
    html+=`<div data-sc="${i}" style="background:var(--card2);border:1px solid var(--line);border-left:3px solid ${c.color};border-radius:10px;padding:10px 13px;margin-bottom:8px">
      <div style="font-size:.82rem;color:${c.color};margin-bottom:5px;display:flex;align-items:center">${c.icon} ${c.school}<span class="sc-badge" style="display:none;margin-left:auto;font-size:.56rem;background:var(--jade);color:#fff;padding:1px 6px;border-radius:8px;white-space:nowrap">AI深度</span></div>
      <div class="sc-local"><div style="font-size:.78rem;color:var(--ink);line-height:1.75;text-align:justify">${c.view}</div>
      <div style="font-size:.68rem;color:var(--ink3);line-height:1.7;margin-top:4px">📌 依据：${c.basis}</div>
      <div style="font-size:.68rem;color:var(--ink2);line-height:1.7;margin-top:2px">🎯 适用：${c.focus}</div></div>
      <div class="sc-ai" style="display:none;margin-top:6px;border-top:1px dashed ${c.color};padding-top:6px"><div style="font-size:.66rem;color:var(--jade);margin-bottom:3px">🤖 AI 深度解读</div><div class="sc-ai-body" style="font-size:.76rem;line-height:1.75;color:var(--ink);text-align:justify"></div></div>
    </div>`;
  });
  html+=`</div>`;
  html+=`<div class="section-block" style="border:1px solid var(--gold2)"><h3>多维综合分析 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（先总后分 · 命局结构 → 17 维细看 · 三术参考分列）</span></h3>`;
  // 综合分析(多维度,含三术论据)
  const ana=zhAnalysis(zh);
  const mingStar=d.mingStars.length?d.mingStars.map(k=>ZW_STARS[k].name).join('、'):'主星不现';
  // 综合定档·总览(先总: 大号打分+雷达+大运曲线+评分依据, AI深度版容器也在内)
  html+=`<div id="ai-dim-16" style="border:1px solid var(--gold2);border-radius:14px;padding:14px 16px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="font-family:'Noto Serif SC',serif;color:var(--gold);font-weight:700">🎯 综合参考 · 规则说明</span><span style="font-size:.7rem;color:var(--ink3)">（先核对事实，再审阅传统解释）</span><span class="ai-dim-badge" style="display:none;font-size:.58rem;background:var(--jade);color:#fff;padding:1px 6px;border-radius:8px;white-space:nowrap">AI深度</span></div><div class="dim-local">${zhDingDangHtml(zh)}</div><div class="dim-ai" style="display:none;margin-top:10px;border-top:1px dashed var(--gold2);padding-top:10px"><div style="font-size:.72rem;color:var(--jade);margin-bottom:4px">🤖 AI 传统解释（不能替代计算事实）</div><div class="dim-ai-body" style="font-size:.76rem;line-height:1.7;color:var(--ink)"></div></div></div>`;
  // 三术论据横条
  html+=`<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 16px;font-size:.76rem;color:var(--ink2)">
  <span style="background:var(--card2);border:1px solid var(--line);padding:5px 13px;border-radius:14px">紫微 · 命宫${ZHI[d.mingGong]} · ${mingStar} · ${['水二','木三','金四','土五','火六'][d.ju-2]}局</span>
  <span style="background:var(--card2);border:1px solid var(--line);padding:5px 13px;border-radius:14px">奇门 · ${d.juInfo.yang?'阳':'阴'}遁${d.juInfo.ju}局 · ${GONG_STAR[d.zfGong]}落${QM_GONG[d.zfGong-1]}宫</span>
  <span style="background:var(--card2);border:1px solid var(--line);padding:5px 13px;border-radius:14px">六爻 · ${d.guaName}卦 · ${['初','二','三','四','五','上'][d.dongYao-1]}爻动变${d.changeName}</span>
  </div>`;
  html+=`<div class="dim-waterfall">`;
  ana.dims.forEach((dim,idx)=>{
    if(idx===16) return; // 综合定档已有上方大卡(id=ai-dim-16),跳过普通卡避免重复与id冲突
    html+=`<div class="desc-item" id="ai-dim-${idx}" style="background:var(--card);border:1px solid var(--line);padding:9px 12px;border-radius:10px;margin-bottom:10px;break-inside:avoid"><div class="k" style="font-size:.82rem;color:var(--gold);margin-bottom:5px;display:flex;align-items:center"><span style="font-family:'Noto Serif SC',serif;color:var(--gold);margin-right:6px;font-weight:700">${dim.icon}</span>${dim.title}<span class="ai-dim-badge" style="display:none;margin-left:auto;font-size:.58rem;background:var(--jade);color:#fff;padding:1px 6px;border-radius:8px;white-space:nowrap">AI深度</span></div><div class="ai-dim-body" style="font-size:.76rem;color:var(--ink);line-height:1.7;text-align:justify">${dim.content}</div></div>`;
  });
  html+=`</div><div style="margin-top:12px;padding:12px;background:linear-gradient(135deg,rgba(176,138,62,.06),rgba(158,43,37,.04));border-radius:8px;font-size:.85rem;line-height:2;color:var(--ink)">${ana.total}</div></div>`;
  // 紫微参考维度卡(独立于18维,勾选"参考紫微斗数"时显示; AI输出【紫微专断】段点亮, 否则显示本地排盘摘要)
  try{
    if(typeof zhZwRefText==='function'){
      const zwInit=zhZwRefText(d);
      if(zwInit){
        html+=`<div class="desc-item" id="ai-dim-18" style="border:1px dashed var(--gold2);background:var(--card);padding:9px 12px;border-radius:10px;margin:0 0 10px;break-inside:avoid"><div class="k" style="font-size:.82rem;color:var(--gold);margin-bottom:5px;display:flex;align-items:center"><span style="font-family:'Noto Serif SC',serif;color:var(--gold);margin-right:6px;font-weight:700">♈</span>紫微参考<span style="font-size:.66rem;color:var(--ink3);font-weight:400;margin-left:6px">（独立参考维度 · AI 输出【紫微专断】段后点亮）</span><span class="ai-dim-badge" style="display:none;margin-left:auto;font-size:.58rem;background:var(--gold);color:#fff;padding:1px 6px;border-radius:8px;white-space:nowrap">AI深度</span></div><div class="ai-dim-body" style="font-size:.76rem;color:var(--ink);line-height:1.7;text-align:justify;white-space:pre-line">${zwInit.replace(/【紫微斗数参考】\n?/,'')}</div></div>`;
      }
    }
  }catch(e){};
  html+=`</div>`;
  html+=`<div class="sec-page" id="zh-sec-4" style="display:none">`;
  // AI 深度解读(接入大模型,综合典籍+深度思考)
  html+=`<div class="section-block" style="border:1px solid var(--jade)"><h3>🤖 AI 深度解读 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（计算事实只读；解读需核对依据；当前流派：<b style="color:var(--jade)">${SCHOOLS[lastSchool]}</b>，可回排盘表单顶部下拉切换）</span></h3>`;
  html+=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><button class="btn btn-primary" id="ai-deep-btn" onclick="aiDeepAnalyze()" style="border-color:var(--jade);background:var(--jade);color:#fff">🤖 一键 AI 深化 18 维</button><button class="btn btn-ghost" onclick="aiExtractPrompt()" style="font-size:.78rem;border-color:var(--gold);color:var(--gold)">📋 提取 Prompt（无 Key 用）</button><span style="font-size:.72rem;color:var(--ink3)">方式一：配置 API Key 一键生成；方式二：提取 Prompt 复制到任意 AI 对话，回复粘回回填</span></div>`;
  html+=`<div id="ai-workflow-controls" class="ai-workflow-controls"></div><div id="ai-deep-box" style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:14px 16px;max-height:420px;overflow-y:auto;font-size:.85rem;line-height:1.9;color:var(--ink)"><span style="color:var(--ink3);font-size:.78rem">JSON回复完整结束后逐维检查四柱身份、字段与引用；错误维度保留草稿，已有结果不被无效回复覆盖。检查不证明自由文本正确或传统预测有效。</span></div>`;
  html+=`<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)"><div style="font-size:.8rem;color:var(--gold);margin-bottom:6px;font-weight:700">💬 AI 追问 <span style="font-size:.68rem;color:var(--ink3);font-weight:400">（先生成解读，再针对任一维度或年份深挖）</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="ai-follow-input" placeholder="如：第14维里2032年为什么是喜用？展开讲讲" style="flex:1;min-width:220px;background:var(--card2);border:1px solid var(--line);color:var(--ink);padding:8px 12px;border-radius:10px;font-size:.82rem;font-family:inherit" onkeydown="if(event.key==='Enter')aiFollowUp()"><button class="btn btn-primary" onclick="aiFollowUp()" id="ai-follow-btn" style="font-size:.78rem;padding:7px 16px">发送追问</button></div><div id="ai-follow-box" style="margin-top:8px;font-size:.82rem;line-height:1.8;color:var(--ink);background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;max-height:320px;overflow-y:auto;display:none"></div></div>`;
  html+=`</div>`;
  html+=`<div class="note">说明：八字以节气定月、子时换日；紫微以农历定命身宫；奇门以时辰定局；六爻以时间起卦。四术共享同一出生时刻基准，结果相互独立、可互为印证。身强弱与用神为简化判断，仅供参酌。典籍佐证与十神心法已并入 AI 深度解读的提示词（知识库参考）中。</div>`;
  html+=`</div>`;
  document.getElementById('zh-result').innerHTML=html;
  aiEvidenceMount();
  mountGanZhiRelations(document.getElementById('zh-result'));
  // 时间轴详情条: 初始显示当前年
  try{ if(typeof tlSelect==='function'&&window._tlData) tlSelect(new Date().getFullYear()); }catch(e){}
}
/* 问真式分段换页: 通用切换(zh-sec-nav 综合排盘 / bz-sec-nav 八字排盘) */
function secGo(navId,prefix,n){
  for(let i=1;i<=10;i++){
    const pg=document.getElementById(prefix+'-'+i);
    if(pg) pg.style.display=(i===n)?'block':'none';
  }
  document.querySelectorAll('#'+navId+' .sec-nav-btn').forEach(b=>{
    b.classList.toggle('active',parseInt(b.dataset.sec)===n);
  });
  const nav=document.getElementById(navId);
  if(nav) window.scrollTo({top:nav.getBoundingClientRect().top+window.scrollY-90,behavior:'smooth'});
}
function zhSecGo(n){ secGo('zh-sec-nav','zh-sec',n); }
/* 流年时间轴: 点击年份卡 → 下方详情条显示该年(引动/应期/提示/建议/AI解读) */
function tlSelect(y){
  const d=(window._tlData||[]).find(f=>f.y===y);
  const box=document.getElementById('tl-detail-box');
  if(!d||!box) return;
  box._curY=y;
  // 卡片高亮
  document.querySelectorAll('[data-year]').forEach(c=>{
    const on=c.getAttribute('data-year')===String(y);
    c.style.boxShadow=on?'0 0 0 2px var(--gold2)':'';
    c.style.transform=on?'scale(1.06)':'';
    c.style.zIndex=on?'3':'';
  });
  const ai=window._tlAi&&window._tlAi[y];
  const ks=d.good?'🌿 喜用':d.bad?'⚠️ 忌神':'🕰️ 闲平';
  const pilTxt={'年':'祖上/家族','月':'父母/环境','日':'自身/婚姻','时':'子女/晚运'};
  const rels=d.rels.length?d.rels.map(r=>`${r.name}<b style="color:${r.type==='六冲'||r.type==='冲'?'var(--red)':r.type==='三刑'||r.type==='六害'?'var(--orange)':'var(--gold)'}">·${r.pillar}</b><span style="color:var(--ink3)">(${pilTxt[r.pillar]})</span>`).join('　'):'<span style="color:var(--ink3)">无明显引动</span>';
  box.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-bottom:8px;font-size:.9rem"><b style="font-size:1.12rem;color:var(--gold);font-family:'Noto Serif SC',serif">${d.y} ${GAN[d.g]}${ZHI[d.z]}</b><span style="color:var(--ink2)">干·${tterm(d.tgName)}</span><span style="color:var(--gold2)">支·${tterm(d.tzName)}</span><span style="font-size:.66rem;color:var(--ink3)">藏干 ${d.zzAll}</span><span style="font-size:.78rem;color:${d.good?'var(--jade)':d.bad?'var(--red)':'var(--ink2)'}">${ks}</span><span style="font-size:.7rem;padding:1px 8px;border-radius:8px;color:#fff;background:${d.strong==='强'?'var(--red)':d.strong==='中'?'var(--orange)':'var(--ink3)'}">应期·${d.strong}</span></div>
  <div style="font-size:.76rem;color:var(--ink2);line-height:1.8;margin-bottom:5px">引动：${rels}</div>
  <div style="font-size:.8rem;color:var(--ink);line-height:1.7;margin-bottom:2px">${d.tip}</div>
  <div style="font-size:.8rem;color:${d.good?'var(--jade)':d.bad?'var(--red2)':'var(--gold2)'};line-height:1.7">${d.adv}</div>
  <div class="tl-ai-body" style="display:${ai?'block':'none'};margin-top:9px;padding-top:9px;border-top:1px dashed var(--line);font-size:.78rem;line-height:1.9;color:var(--jade)">🤖 AI解读：${ai||''}</div>`;
}
/* 新中式三主题切换: zhiyun纸韵(默认) / xuanmo玄墨(暗色) / qinglv青绿 */
function setTheme(t){
  document.body.setAttribute('data-theme',t);
  try{localStorage.setItem('mingli_theme',t);}catch(e){}
  document.querySelectorAll('.theme-dot').forEach(d=>d.classList.toggle('active',d.dataset.theme===t));
}
(function(){
  var t='zhiyun';
  try{t=localStorage.getItem('mingli_theme')||'zhiyun';}catch(e){}
  if(t==='xuanmo'||t==='qinglv'||t==='zhiyun') setTheme(t);
})();

// 术语知识库(十神词条含王家荣实战断语)

function aWealth(zh,q){
  const nl=nowLiuNian(zh);
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 典籍要旨</b><br><span style="font-size:.8rem">《滴天髓》云：『何知其人富，财气通门户。』财星须有气、身能任财，方能聚而不散。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 您的财星格局</b><br><span style="font-size:.82rem">八字中正财'+zh.caiZheng+'位、偏财'+zh.caiPian+'位，财星'+(zh.caiWei.length?'见于 '+zh.caiWei.join('、'):'不显')+'。'+(strengthText(zh,'日主身强能任财，财可得、可守','日主身弱，财多反为劳，宜借力分财'))+'。'+(zh.caiPian>zh.caiZheng?'偏财旺于正财，来财偏快、善抓机遇，然易大起大落，宜见好即收':'正财为体，收入稳定，细水长流')+'。'+(zh.caiKu.length?'命中带财库（'+zh.caiKu.map(z=>ZHI[z]).join('、')+'），中晚年聚财之力佳':'财无库藏，得财易散，宜主动储蓄')+'。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 流年财运</b><br><span style="font-size:.82rem">当前'+nl.year+'年（'+GAN[nl.g]+ZHI[nl.z]+'年，'+nl.name+'年），'+([4,5].includes(nl.tg)?'值财星流年，财机显现，可适度进取':'非财星之年，宜守成积累，稳中求进')+'。'+(strengthText(zh,'把握财星流年投资扩张','身弱之年更宜求稳，避免高杠杆'))+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 建议</b><br><span style="font-size:.82rem">宜以'+WUXING[zh.yongShen]+'为用，从事相关行业；财不露白、闲钱定投，逢财库之年（辰戌丑未）可加大储蓄配置。</span></div>';
  return s;
}
function aMarriage(zh,q){
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 典籍要旨</b><br><span style="font-size:.8rem">《三命通会》论夫妻：男以财为妻，女以官为夫，夫妻宫（日支）为婚姻之宅。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 您的感情格局</b><br><span style="font-size:.82rem">'+(zh.gender?'男命以财星为妻':'女命以官杀为夫')+'，命局'+(zh.hunCount===0?'夫妻星不显，感情宜晚成，配偶多经介绍或远缘':zh.hunCount<=2?'夫妻星得位，姻缘有定，把握适婚之龄':'夫妻星多现，异性缘佳，宜防多情多扰')+'。夫妻宫坐'+ZHI[zh.fuQiGong]+'，主气'+SHISHEN_NAME[zh.fqTs]+'，'+(zh.fqTs===4||zh.fqTs===5?'配偶务实顾家，重物质安稳':[6,7].includes(zh.fqTs)?'配偶有主见、要求较高，需多沟通':[2,3].includes(zh.fqTs)?'配偶才情活泼，相处有情有趣':'配偶温和，与您相敬如宾')+'。</span></div>';
  if(zh.taoHua>=0&&[zh.yearGZ[1],zh.monthGZ[1],zh.dayGZ[1],zh.hourGZ[1]].includes(zh.taoHua)) s+='<div style="margin-bottom:6px"><span style="font-size:.82rem">命带<b style="color:var(--red)">桃花</b>（'+ZHI[zh.taoHua]+'），魅力人缘佳，感情机会多，但桃花重者宜守心、防烂桃花。</span></div>';
  s+='<div><b style="color:var(--gold)"> 建议</b><br><span style="font-size:.82rem">多倾听对方、少争对错；选择与您五行相合或性格互补者为佳。适婚年份宜择'+WUXING[zh.yongShen]+'旺之流年。</span></div>';
  return s;
}
function aCareer(zh,q){
  const nl=nowLiuNian(zh);
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 典籍要旨</b><br><span style="font-size:.8rem">《渊海子平》云：『先观月令，次看日主，再看财官。』格局之用，首重月令提纲。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 您的格局倾向</b><br><span style="font-size:.82rem">';
  const ts=zh.tsCount;
  const arr=[[ts[8]+ts[9],'印星','学术文化、教育科研'],[ts[2]+ts[3],'食伤','创意技术、艺术自由'],[ts[6]+ts[7],'官杀','管理仕途、体制规则'],[ts[4]+ts[5],'财星','商务经营、实业金融']].sort((a,b)=>b[0]-a[0]);
  s+=(arr[0][0]>0?arr[0][1]+'最显（'+arr[0][0]+'位），宜走'+arr[0][2]+'路线':'')+(arr[1][0]>0?'；次之'+arr[1][1]+'（'+arr[1][0]+'位），可辅以'+arr[1][2]:'')+'。'+(strengthText(zh,'身强气足，可担大任，宜主动进取、独当一面','身弱宜借平台之力，跟对人、选对行，稳中求进'))+'。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 当前事业运</b><br><span style="font-size:.82rem">'+nl.year+'年值'+nl.name+'流年，'+([6,7].includes(nl.tg)?'官杀透出，事业责任加重，或有机遇晋升，须顶住压力':'食伤财年，利展现才华、开拓新局，但忌锋芒过露')+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 建议</b><br><span style="font-size:.82rem">'+zh.dy.startAge+'岁起运，当前处于'+SHISHEN_NAME[tenGod(zh.dg,zh.dy.dyList[0].g)]+'运区间，宜贴合'+WUXING[zh.yongShen]+'属性行业发展，循序渐进。</span></div>';
  return s;
}
function aStudy(zh,q){
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 典籍要旨</b><br><span style="font-size:.8rem">印星主学业文书，食伤主聪明才思；文昌贵人助考运。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 学习格局</b><br><span style="font-size:.82rem">印星'+(zh.tsCount[8]+zh.tsCount[9])+'位、食伤'+(zh.tsCount[2]+zh.tsCount[3])+'位。'+(zh.tsCount[8]+zh.tsCount[9]>=2?'印旺，吸收力强，宜系统研读、深造考试皆利':zh.tsCount[2]+zh.tsCount[3]>=2?'食伤旺，聪慧灵动，宜理解式学习、扬长于创意发挥':'印食平衡，学力中平，贵在方法得当、持之以恒')+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 建议</b><br><span style="font-size:.82rem">大考宜择'+WUXING[zh.yongShen]+'旺之流年（逢印比生助之年）；以真题为纲，查漏补缺，心态平和为上。</span></div>';
  return s;
}
function aHealth(zh,q){
  const sorted=[...zh.wxCount].map((c,i)=>({c,i})).sort((a,b)=>b.c-a.c);
  const ts=sorted[0], tw=sorted[sorted.length-1];
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 医易同源</b><br><span style="font-size:.8rem">中医五行应五脏：木主肝胆、火主心、土主脾胃、金主肺、水主肾。命局五行过旺过弱，皆易在其对应脏腑显疾。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 您的体质提示</b><br><span style="font-size:.82rem">'+(ts.c>=3?'五行'+WUXING[ts.i]+'偏旺（'+ts.c+'分），注意'+WX_ORGAN[ts.i]+'过用，忌熬夜耗气':'五行分布尚平')+'。'+(tw.c===0||tw.c===1?'五行'+WUXING[tw.i]+'偏弱（'+tw.c+'分），'+WX_ORGAN[tw.i]+'宜日常补益、规律作息':'偏弱之脏宜食疗温养')+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 建议</b><br><span style="font-size:.82rem">养生以'+WUXING[zh.yongShen]+'为补：宜'+['疏肝理气、舒展肢体','养心安神、戒躁静心','健脾养胃、少思虑','润肺防燥、呼吸调息','固肾藏精、节欲保元'][zh.yongShen]+'；起居有常，情志调畅为上。</span></div>';
  return s;
}
function aPersonality(zh,q){
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 性格画像</b><br><span style="font-size:.82rem">'+GAN_CHAR[zh.dg]+'。'+(zh.mainTenGods.length?TS_CHAR[zh.mainTenGods[0].i]:'')+(strengthText(zh,'身强之人自信独立、主见分明，然易固执自专，宜多纳谏言','身弱之人温润谦和、心思细密，然易优柔多虑，宜增自信'))+'。</span></div>';
  if(zh.mingStars.length) s+='<div style="margin-bottom:6px"><span style="font-size:.82rem">紫微视角：'+ZW_CHAR[zh.mingStars[0]]+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 成长建议</b><br><span style="font-size:.82rem">性格无优劣，知其所长、避其所短：'+(strengthText(zh,'收敛锋芒、学会合作，以柔济刚','立定主见、敢于争取，以刚补柔'))+'。与'+WUXING[(GAN_WX[zh.dg]+4)%5]+'五行之人相处更易合拍。</span></div>';
  return s;
}
function aLuck(zh,q){
  const nl=nowLiuNian(zh);
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> '+nl.year+'年（'+GAN[nl.g]+ZHI[nl.z]+'年）运势</b><br><span style="font-size:.82rem">值<b>'+nl.name+'</b>流年。'+([0,1].includes(nl.tg)?'比劫之年，人缘旺、合作多，但防竞争破财，忌合伙轻率':[2,3].includes(nl.tg)?'食伤之年，才华显露、想法多，利创作输出，但忌口舌是非':[4,5].includes(nl.tg)?'财星之年，财机显现，宜积极求财，稳中进取':[6,7].includes(nl.tg)?'官杀之年，事业压力与机遇并存，守规则、扛压力则有进益':'印星之年，利学习进修、贵人提携，宜沉淀积累')+'。</span></div>';
  s+='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 与您的喜忌</b><br><span style="font-size:.82rem">'+(GAN_WX[nl.g]===zh.yongShen||ZHI_WX[nl.z]===zh.yongShen?'流年值用神'+WUXING[zh.yongShen]+'，为喜用之年，运势顺遂，宜把握良机':'流年'+WUXING[GAN_WX[nl.g]]+'、'+WUXING[ZHI_WX[nl.z]]+'，非用神之年，宜守成审慎，蓄势待发')+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 行动提示</b><br><span style="font-size:.82rem">'+(strengthText(zh,'身强逢忌神年亦能扛事，主动化解即可','身弱之年更宜低调蓄力，广结善缘、借势而行'))+'。</span></div>';
  return s;
}
function aDayun(zh,q){
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 大运走势（'+zh.dy.startAge+'岁起运，'+(zh.dy.forward?'顺行':'逆行')+'）</b></div>';
  s+='<div style="margin-bottom:6px;font-size:.82rem">';
  zh.dy.dyList.slice(0,5).forEach((dy,i)=>{
    const tg=tenGod(zh.dg,dy.g);
    const good=(zh.strong&&[2,3,4,5,6,7].includes(tg))||(!zh.strong&&[0,1,8,9].includes(tg));
    s+='<div style="padding:3px 0">'+(i+1)+'. <b>'+GAN[dy.g]+ZHI[dy.z]+'</b>（'+SHISHEN_NAME[tg]+'运，'+dy.age+'-'+dy.endAge+'岁）：'+(good?'喜用大运，顺遂得助':'平稳之运，宜守宜学')+'</div>';
  });
  s+='</div>';
  s+='<div><b style="color:var(--gold)"> 提示</b><br><span style="font-size:.82rem">大运十年一轮，喜用神大运宜进取，忌神大运宜守成。当前'+SHISHEN_NAME[tenGod(zh.dg,zh.dy.dyList[0].g)]+'运区间，'+(strengthText(zh,'行克泄耗之事正合身强之需','宜以印比助身为要'))+'。</span></div>';
  return s;
}
// 盲派干支职业象
const GZ_JOB={0:'甲木·栋梁公门，宜文教管理、木材园林',1:'乙木·花草藤艺，宜园艺文书、纺织丝绸',2:'丙火·太阳传媒，宜影视广告、能源电力',3:'丁火·星光电子，宜网络文化、电子科技',4:'戊土·大地高坡，宜地产建筑、仓储收藏',5:'己土·田园庭院，宜农业牧业、建材水泥',6:'庚金·顽铁利器，宜机械五金、军警手术',7:'辛金·珠玉针剪，宜医药法律、金融精工',8:'壬水·江河大海，宜航运物流、贸易运输',9:'癸水·雨露智谋，宜咨询玄学、医道药疗'};
const ZHI_JOB={0:'子·圆滑运算，宜会计精算、玄学技能',1:'丑·寒土仓库，宜仓储矿井、军工银行',2:'寅·公门官署，宜政府机关、文化场所',3:'卯·纸张传播，宜传媒出版、网络机构',4:'辰·车辆大机，宜运输车辆、集团机构',5:'巳·文化思想，宜网络教育、寺院文艺',6:'午·电子信息，宜广告电力、文化中心',7:'未·田园地产，宜土地经营、酒店酒食',8:'申·银行金融，宜金融司法、物理科技',9:'酉·法律精密，宜法律钟表、隐学精技',10:'戌·文库学校，宜教育出版、军火科技',11:'亥·计算数字，宜会计财务、科技运算'};
function aIndustry(zh,q){
  const yw=zh.yongShen;
  const ts=zh.tsCount;
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 适配行业</b><br><span style="font-size:.82rem">喜用神为<b>'+WUXING[yw]+'</b>，五行属'+WUXING[yw]+'的行业最利：<br>'+WX_INDUSTRY[yw]+'。</span></div>';
  s+='<div style="margin-bottom:6px"><span style="font-size:.82rem">结合十神：'+(ts[6]+ts[7]>=2?'官杀旺宜管理、公职、纪律部队；':'')+(ts[4]+ts[5]>=2?'财星旺宜商务、金融、经营实业；':'')+(ts[2]+ts[3]>=2?'食伤旺宜技术、艺术、创意传媒；':'')+(ts[8]+ts[9]>=2?'印星旺宜教育、文化、科研咨询。':'')+'</span></div>';
  // 盲派干支职业象
  const seen=new Set();
  const jobs=[];
  zh.pillars.forEach(gz=>{
    const g=GZ_JOB[gz[0]], z=ZHI_JOB[gz[1]];
    if(g&&!seen.has(g)){seen.add(g);jobs.push(g);}
    if(z&&!seen.has(z)){seen.add(z);jobs.push(z);}
  });
  if(jobs.length) s+='<div style="margin-bottom:6px"><span style="font-size:.82rem"><b style="color:var(--gold)">干支职业象：</b>'+jobs.slice(0,4).join('；')+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 建议</b><br><span style="font-size:.82rem">职业选择以「用神行业为主、十神天赋为辅、干支职业象为参」；方位宜'+['东方','南方','中央','西方','北方'][yw]+'，利于发展。中年后按大运走势调整方向。</span></div>';
  return s;
}
function aTerm(q,zh){
  // 智能匹配: 完全匹配/包含匹配/子串匹配/关键词匹配
  const cleanQ=q.replace(/[？?，,。!！是什么的叫啥叫哪些有哪些]*$/,'');
  const matches=[]; // [{key,score}]
  for(const k in KB_TERMS){
    let score=0;
    if(cleanQ===k) score=100; // 完全匹配
    else if(cleanQ.includes(k)) score=80; // q包含词条
    else if(k.includes(cleanQ)&&cleanQ.length>=2) score=70; // 词条包含q(短词)
    else{
      // 关键词匹配: 拆q为2字词,任一词条包含
      for(let i=0;i<=cleanQ.length-2;i++){
        const sub=cleanQ.substr(i,2);
        if(sub.length===2 && k.includes(sub) && !['什么','的','是','叫','咋','呢','的'].includes(sub)) score=Math.max(score,50);
      }
    }
    if(score>0){const entry=termKnowledge(k);matches.push({key:k,entry:{w:entry.category,d:entry.explanation},score});}
  }
  matches.sort((a,b)=>b.score-a.score);
  if(matches.length){
    const top=matches.slice(0,3);
    let html='<div style="margin-bottom:8px"><b style="color:var(--gold)"> '+top[0].key+'</b> <span style="font-size:.72rem;color:var(--ink3)">· '+top[0].entry.w+'</span></div>';
    html+='<div style="font-size:.82rem;line-height:1.9;margin-bottom:8px">'+top[0].entry.d+'</div>';
    // 命盘数据相关解读
    if(zh && (top[0].key==='用神'||top[0].key==='喜用神'||top[0].key==='忌神'||top[0].key==='调候'||top[0].key==='格局')){
      html+='<div style="background:var(--card2);border-left:3px solid var(--gold);padding:8px 10px;border-radius:6px;font-size:.78rem;line-height:1.7;margin-bottom:8px">';
      html+=`<b style="color:var(--gold)">此盘参考：</b>日主${GAN[zh.dg]}${WUXING[GAN_WX[zh.dg]]}（${zh.strengthType}），喜用${WUXING[zh.yongShen]}，忌${WUXING[(zh.yongShen+2)%5]}${WUXING[(zh.yongShen+3)%5]}；大运流年走喜用则顺，逢忌神则须防。`;
      html+='</div>';
    }
    if(matches.length>1){
      html+='<div style="font-size:.76rem;color:var(--ink3);margin-top:6px">相关词条：';
      html+=top.slice(1).map(m=>` <span style="cursor:default">${m.key}</span>`).join('·');
      html+='</div>';
    }
    html+=VERIFIED_TERM_NOTES[top[0].key]?readingCitations(VERIFIED_TERM_NOTES[top[0].key].keys):'<small>出处待核验</small>';
    return html;
  }
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 术语说明</b><br><span style="font-size:.82rem">「'+q.slice(0,20)+'」未直接命中本地术语库，可尝试询问：';
  // 推荐核心术语
  const recommend=['十神','用神','喜用神','大运','流年','格局','调候','神煞','藏干','纳音'];
  s+=recommend.slice(0,8).join('、');
  s+='等。</span></div>';
  s+='<div class="retrieve-card">如需查询该术语的古籍出处与详细论述，请回复 <b>「检索：'+q.slice(0,12)+'」</b>，我将联网搜索古籍资料并检索 ima 知识库为您考证。</div>';
  return s;
}
function aGeneral(zh,q){
  const nl=nowLiuNian(zh);
  let s='<div style="margin-bottom:6px"><b style="color:var(--gold)"> 命局总览</b><br><span style="font-size:.82rem">日主'+GAN[zh.dg]+WUXING[GAN_WX[zh.dg]]+'，'+(strengthText(zh,'身强喜克泄耗','身弱喜生助'))+'，以'+WUXING[zh.yongShen]+'为用神。四柱'+zh.pillars.map(g=>GAN[g[0]]+ZHI[g[1]]).join(' ')+'，紫微命宫'+ZHI[zh.mingGong]+'（'+(zh.mingStars.length?zh.mingStars.map(k=>ZW_STARS[k].name).join('、'):'主星不在此宫')+'），奇门时盘'+(zh.juInfo.yang?'阳':'阴')+'遁'+zh.juInfo.ju+'局，六爻起得'+zh.guaName+'卦。</span></div>';
  s+='<div style="margin-bottom:6px"><span style="font-size:.82rem">当前'+nl.year+'年（'+GAN[nl.g]+ZHI[nl.z]+'年）值'+nl.name+'流年，'+(GAN_WX[nl.g]===zh.yongShen||ZHI_WX[nl.z]===zh.yongShen?'喜用之年，宜顺势进取':'平稳之年，宜守正蓄力')+'。</span></div>';
  s+='<div><b style="color:var(--gold)"> 下一步</b><br><span style="font-size:.82rem">您可以追问具体方面：财运？婚姻？事业？健康？今年运势？或让我解释任何术语。</span></div>';
  return s;
}

// 农历输入同步公历(双向联动)
function zhSyncFromLunar(){
  const cal=document.getElementById('zh-cal').value;
  if(cal!=='1') return; // 仅农历模式生效
  const y=parseInt(document.getElementById('zh-ly').value);
  const m=parseInt(document.getElementById('zh-lm').value);
  const d=parseInt(document.getElementById('zh-ld').value);
  const isLeap=parseInt(document.getElementById('zh-ll').value)===1;
  const date=lunar2solar(y,m,d,isLeap);
  if(!date) return;
  const ds=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  document.getElementById('zh-solar').value=ds;
}
// 农历选择联动: 年月变化刷新日, 全部变化同步公历
function zhOnLunarChange(changedId){
  try{
    const id=changedId||(document.activeElement&&document.activeElement.id);
    if(id==='zh-ly') zhRefreshLunarMonths();
    if(id==='zh-ll'&&document.getElementById('zh-ll').value==='1') document.getElementById('zh-lm').value=leapMonth(Number(document.getElementById('zh-ly').value));
    if(id==='zh-lm'&&Number(document.getElementById('zh-lm').value)!==leapMonth(Number(document.getElementById('zh-ly').value))) document.getElementById('zh-ll').value='0';
    if(id!=='zh-ld') zhRefreshLunarDays();
    zhSyncFromLunar();
  }catch(e){alert(e.message||String(e));}
}

/* ======================== 合婚配对（双盘互参·15维综合） ======================== */
 // 子丑 寅亥 卯戌 辰酉 巳申 午未

 // 子未 丑午 寅巳 卯辰 申亥 酉戌
 // 寅巳申 丑戌未 三刑
// v5.8 天干五合(甲己合土·乙庚合金·丙辛合水·丁壬合木·戊癸合火)


// v5.8 纳音五行(年命)

// v5.8 紫微命宫主星配对(传统有情组合)


// 两地支关系

// 对方日主为我之十神 → 婚配断语(性别修正)

/* ============ v5.9 合婚深度研判（精而不多：星宫同位·阴阳互济·婚期窗口·相处处方） ============ */
 // 配偶星: 男财(偏4正5) 女官(七6正7)
 // 申子辰在酉·寅午戌在卯·巳酉丑在午·亥卯未在子


// 深度研判 → AI 可读文本(去HTML标签, 供合婚双通道注入)

function hhReadSide(side){
  const name=document.getElementById('hh'+side+'-name').value.trim();
  const gender=parseInt(document.getElementById('hh'+side+'-gender').value);
  const ds=document.getElementById('hh'+side+'-date').value;
  const hourIdx=parseInt(document.getElementById('hh'+side+'-hour').value);
  const place=document.getElementById('hh'+side+'-place').value.trim();
  if(!ds){alert('请填写'+(side==='1'?'甲':'乙')+'方日期');return null;}
  const [y,m,d]=ds.split('-').map(Number);
  const date=withBirthTime(parseCivilDate(ds),hourIdx,document.getElementById('hh'+side+'-time').value);
  if(isNaN(date.getTime())){alert('日期无效');return null;}
  const zh=zhCompute(date,hourIdx,gender,place,{preciseTime:true});
  if(!zh){alert((side==='1'?'甲':'乙')+'方排盘失败');return null;}
  return {name:name||(side==='1'?'甲方':'乙方'),gender,place,zh};
}
function hhCast(){
  try{
  const A=hhReadSide('1'), B=hhReadSide('2');
  if(!A||!B) return;
  const r=heHunCompute(A.zh,B.zh,A.name,B.name);
  renderHH(r,A,B);
  // v5.10 保存最近合婚摘要(命盘婚姻感情卡片回填用)
  try{
    localStorage.setItem('mingli_hh_last',JSON.stringify({a:A.name,b:B.name,score:r.score,summary:r.summary.slice(0,40),highlights:(r.highlights||[]).slice(0,4),t:Date.now()}));
  }catch(e){}
  document.getElementById('hh-ai-wrap').style.display='block';
  document.getElementById('hh-ai-box').innerHTML='<div style="color:var(--ink3);font-size:.8rem">两种方式：① 点「🤖 AI 深度合婚分析」（需已配置 AI Key）一键生成；② 点「📋 提取 Prompt」复制到任意 AI 对话，回复粘回「📥 粘贴回填」。</div>';
  try{document.getElementById('hh-ai-wrap').scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){}
  }catch(e){alert(e.message||String(e));}
}
function hhSwap(){
  ['name','gender','date','hour','place','time'].forEach(f=>{
    const a=document.getElementById('hh1-'+f), b=document.getElementById('hh2-'+f);
    const t=a.value; a.value=b.value; b.value=t;
  });
}
// v5.10 从命盘婚姻卡片前往合婚: 自动把当前命盘预填为甲方, 切到合婚tab
function hhGoFromMingpan(){
  try{
    if(!lastZh){alert('请先在「综合排盘」排好本命盘，再前往合婚配对');return;}
    const zh=lastZh;
    const pad=n=>String(n).padStart(2,'0');
    const set=(id,v)=>{const el=document.getElementById(id); if(el) el.value=v;};
    set('hh1-name',lastName||'');
    set('hh1-gender',String(zh.gender));
    set('hh1-date',zh.date.getFullYear()+'-'+pad(zh.date.getMonth()+1)+'-'+pad(zh.date.getDate()));
    set('hh1-hour',String(zh.hourIdx));
    if(zh.place) set('hh1-place',zh.place);
    const tab=document.querySelector('[data-tab="hehun"]');
    if(tab) tab.click();
    const p=document.getElementById('panel-hehun');
    if(p) p.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){}
}
function renderHH(r,A,B){
  const sc=r.score;
  const scColor=sc>=85?'var(--red)':sc>=70?'var(--gold)':sc>=55?'var(--ink2)':sc>=40?'var(--orange)':'var(--ink3)';
  let html='<div class="result-title">💍 合盘结果 '+ esc0(A.name)+' × '+esc0(B.name)+'</div>';
  html+='<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;background:linear-gradient(135deg,rgba(176,138,62,.1),rgba(106,90,138,.04));border:1px solid var(--gold2);border-radius:12px;padding:16px 20px;margin-bottom:12px">';
  html+='<div style="text-align:center;min-width:110px"><div style="font-size:.68rem;color:var(--ink3);letter-spacing:.2em">合盘指数</div><div style="font-size:2.6rem;font-weight:800;color:'+scColor+';line-height:1.1">'+sc+'<span style="font-size:.9rem;color:var(--ink3)">/100</span></div></div>';
  html+='<div style="flex:1;min-width:220px;font-size:.86rem;line-height:1.8">'+r.summary+'</div></div>';
  // 亮点速览(正向维度)
  if(r.highlights&&r.highlights.length){
    html+='<div style="margin-bottom:12px;padding:9px 13px;background:var(--card2);border:1px solid var(--gold2);border-radius:10px"><div style="font-size:.68rem;color:var(--ink3);letter-spacing:.12em;margin-bottom:5px">✨ 亮点速览</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+r.highlights.map(h=>'<span style="font-size:.72rem;color:var(--jade);background:rgba(45,140,120,.08);border:1px solid rgba(45,140,120,.25);padding:2px 10px;border-radius:14px">'+esc0(h)+'</span>').join('')+'</div></div>';
  }
  // v5.9 深度研判(星宫同位·阴阳互济·婚期窗口·相处处方)
  if(r.deep&&r.deep.length){
    html+='<div class="section-block" style="border:1px solid var(--gold)"><h3>🔍 深度研判 <span style="font-size:.7rem;color:var(--ink3);font-weight:400">（合婚核心法门 · 星宫同位 / 阴阳互济 / 婚期窗口 / 相处处方）</span></h3>';
    html+='<div style="display:flex;flex-direction:column;gap:8px">';
    r.deep.forEach(d=>{
      const dc=d.score>0?'var(--jade)':d.score===0?'var(--ink2)':'var(--orange)';
      html+='<div style="background:var(--card2);border:1px solid var(--line);border-left:3px solid '+(d.icon==='🔑'?'var(--gold)':d.icon==='💍'?'var(--red)':d.icon==='⚖️'?'var(--teal)':'var(--purple)')+';border-radius:8px;padding:9px 12px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:.82rem">'+d.icon+' '+d.title+'</b>'+(d.score>0?'<span style="font-size:.6rem;color:#fff;background:var(--jade);padding:1px 7px;border-radius:8px">+'+d.score+'</span>':'')+'</div><div style="font-size:.78rem;color:var(--ink);line-height:1.85;margin-top:4px;text-align:justify">'+d.html+'</div></div>';
    });
    html+='</div></div>';
  }
  // 两人小盘
  html+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">';
  [A,B].forEach((s,i)=>{
    html+='<div style="flex:1;min-width:200px;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:10px 12px"><div style="font-size:.78rem;font-weight:700;color:'+(i===0?'var(--gold)':'var(--jade)')+'">'+esc0(s.name)+' · '+s.zh.pillars.map(p=>GAN[p[0]]+ZHI[p[1]]).join(' ')+'</div><div style="font-size:.7rem;color:var(--ink3);margin-top:3px">'+s.zh.date.getFullYear()+'年 · 日主'+GAN[s.zh.dg]+WUXING[GAN_WX[s.zh.dg]]+' · '+(strengthLabel(s.zh))+' · 用神'+WUXING[s.zh.yongShen]+(s.zh.place?(' · 出生地'+esc0(s.zh.place)):'')+'</div></div>';
  });
  html+='</div>';
  // 各维度
  html+='<div class="section-block"><h3>合盘各维度</h3><div style="display:flex;flex-direction:column;gap:8px">';
  r.aspects.forEach(a=>{
    const c=a.score>=8?'var(--jade)':a.score>=4?'var(--gold)':a.score>=0?'var(--ink2)':a.score>=-6?'var(--orange)':'var(--red)';
    html+='<div style="background:var(--card2);border:1px solid var(--line);border-left:3px solid '+c+';border-radius:8px;padding:9px 12px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:.82rem">'+a.icon+' '+esc0(a.k)+'</b><span style="font-size:.76rem;color:'+c+';font-weight:700">'+esc0(a.name)+'</span><span style="margin-left:auto;font-size:.72rem;color:'+c+'">'+(a.score>0?'+':'')+a.score+'</span></div><div style="font-size:.76rem;color:var(--ink2);line-height:1.7;margin-top:4px">'+esc0(a.desc)+'</div></div>';
  });
  html+='</div></div>';
  html+='<div class="note">合婚为传统民俗文化参考：合盘指数由年/月/日/时四柱支关系、天干五合（鸳鸯合）、纳音年命、九星命卦、紫微命宫、日主十神互看、用神互补、五行补缺、大运同步、调候气候互补等 15 维确定性规则合成，仅描述气场倾向，不作感情成败定论。缘分在人，经营在心。</div>';
  document.getElementById('hh-result').innerHTML=html;
}
// AI 合婚深度解读(流式)
function hhAiDeep(){
  const c=aiGetConfig();
  const box=document.getElementById('hh-ai-box');
  if(!c.key){alert('请先在右上角「🤖 AI 深度解读设置」配置 API Key');return;}
  // 取当前合盘数据(重算以获得上下文)
  const A=hhReadSide('1'), B=hhReadSide('2');
  if(!A||!B) return;
  const r=heHunCompute(A.zh,B.zh,A.name,B.name);
  const btn=document.getElementById('hh-ai-btn');
  if(btn){btn.disabled=true;btn.textContent='⏳ AI 合婚推演中…';}
  box.innerHTML='<div style="color:var(--ink3);font-size:.82rem;text-align:center;padding:10px">🤖 双盘互参推演中…</div>';
  const system='你是一位精通传统合婚文化的命理研究者，深谙《三命通会》合婚法、《滴天髓》阴阳观与子平十神论。基于双方完整命盘独立研判（不依赖任何既有评分，自行从干支十神、合冲刑害、配偶星归位、阴阳纳音、紫微命卦等盘面推导）：输出五段【相处模式】【感情浓度】【潜在矛盾点】【经营建议】【综合断】，每段150-260字；每段引用双方具体干支十神与合冲关系作依据，推断过程可见；【综合断】给出缘分档位定性（上等/中上/中平/磨合/慎配）与一句总判，不必给精确分数；语言专业而有温度，结论只作倾向参考，禁止"必定离婚/注定不和"式断言。';
  const user=hhPromptBody(A,B,r)+'\n\n请基于以上完整盘面与准则，给出深度合婚研判。';
  const payload={model:c.model,messages:[{role:'system',content:system},{role:'user',content:user}],temperature:0.7,stream:true};
  if(c.maxTok>0) payload.max_tokens=c.maxTok;
  let acc='';
  const paint=()=>{ box.innerHTML=aiMd2Html(acc); };
  aiStreamChat(aiEndpoint(c),{
    method:'POST',headers:aiHeaders(c),body:JSON.stringify(payload)
  },{
    idleMs:90000,totalMs:300000,
    onDelta:(d)=>{ acc+=d; paint(); },
    onDone:(full)=>{
      acc=full||acc; paint();
      try{ const dn=hhFillCards(hhParseDims(acc)); if(btn&&dn) btn.textContent='🤖 重新生成'; }catch(e){}
      if(btn){btn.disabled=false;btn.textContent='🤖 重新生成';}
    },
    onError:(e)=>{
      box.innerHTML='<div style="color:var(--red);font-size:.82rem;padding:10px">❌ '+esc0(e.message||e)+'</div>';
      if(btn){btn.disabled=false;btn.textContent='🤖 AI 深度合婚分析';}
    }
  });
}

/* ======================== AI 追问（多轮对话式深挖） ======================== */
function aiFollowUp(){
  const c=aiGetConfig(),inp=document.getElementById('ai-follow-input'),box=document.getElementById('ai-follow-box'),btn=document.getElementById('ai-follow-btn'),q=inp?.value.trim();
  if(!q||!lastZh||!c.key||!lastAIReply){aiEvidenceNotice('追问需要当前命盘、API设置及已接收的解读。');return;}
  if(aiEvidenceActive||aiFollowActive)return;
  const chart=aiEvidenceChart(),id=chartFactId(chart);
  const current=()=>lastZh&&chartFactId(aiEvidenceChart())===id;
  if(btn)btn.disabled=true;if(box){box.style.display='block';box.textContent='正在生成追问回复…';}
  const system='你是传统文化学习助手。计算事实只读，不得改写四柱或应用评分。不得给财富金额、学历上下限、医学诊断或命运必然结论。区分传统解释与事实，说明条件和不确定性，未核验原文不得当成已核对引文。针对追问用简洁文字回答。当前计算事实：'+JSON.stringify({chartId:id,pillars:chart.pillars,facts:aiFacts(chart),rules:chart.rules});
  const payload={model:c.model,messages:[{role:'system',content:system},{role:'assistant',content:lastAIReply.slice(-12000)},{role:'user',content:q}],stream:true,temperature:0.4};
  aiFollowActive=aiStreamChat(aiEndpoint(c),{method:'POST',headers:aiHeaders(c),body:JSON.stringify(payload)},{
    idleMs:90000,totalMs:180000,
    onDelta:(d,all)=>{if(current()&&box)box.textContent=all;},
    onDone:full=>{if(current()){if(box)box.textContent=full;if(inp)inp.value='';}aiFollowActive=null;if(btn)btn.disabled=false;aiEvidencePaint();},
    onError:()=>{if(current()&&box)box.textContent+='\n请求中断；不会自动重发。';aiFollowActive=null;if(btn)btn.disabled=false;if(lastZh)aiEvidencePaint();}
  });aiEvidencePaint();
}
/* ======================== 命盘导出（图片 + 记录备份） ======================== */
// canvas 绘制命盘速览卡并下载 PNG
function exportChartPng(){
  if(!lastZh){alert(lastCandidates?'时辰未知，请先核对时分；候选模式不导出确定命盘图':'请先排盘');return;}
  const zh=lastZh, dd=zhDingDang(zh), gj=zhGeJuZhuangTai(zh), synthesis=buildMingGeSummary(zh);
  const cv=document.createElement('canvas');
  cv.width=760; cv.height=470;
  const ctx=cv.getContext('2d');
  // 底色与边框
  ctx.fillStyle='#f3efe4'; ctx.fillRect(0,0,760,470);
  ctx.strokeStyle='#b08a3e'; ctx.lineWidth=3; ctx.strokeRect(14,14,732,442);
  ctx.strokeStyle='rgba(176,138,62,.4)'; ctx.lineWidth=1; ctx.strokeRect(22,22,716,426);
  // 标题
  ctx.fillStyle='#8a6d2f'; ctx.font='bold 26px "Noto Serif SC","Songti SC",serif';
  ctx.textAlign='center';
  ctx.fillText('玄机命理盘',380,64);
  ctx.fillStyle='#9a9280'; ctx.font='12px sans-serif';
  ctx.fillText((lastName||'未命名')+' · '+genderLabel(zh)+' · '+zh.date.getFullYear()+'年'+(zh.date.getMonth()+1)+'月'+zh.date.getDate()+'日 '+HOUR_NAMES[zh.hourIdx],380,88);
  // 四柱大字
  const px=[140,300,460,620], names=['年','月','日','时'];
  zh.pillars.forEach((p,i)=>{
    ctx.fillStyle='#9a9280'; ctx.font='13px sans-serif'; ctx.textAlign='center';
    ctx.fillText(names[i]+'柱',px[i],126);
    ctx.fillStyle='#26221c'; ctx.font='bold 44px "Noto Serif SC","Songti SC",serif';
    ctx.fillText(GAN[p[0]],px[i],180);
    ctx.fillText(ZHI[p[1]],px[i],232);
    // 十神/纳音小字
    const ts=tenGod(zh.dg,p[0]);
    ctx.fillStyle='#9a9280'; ctx.font='12px sans-serif';
    ctx.fillText((i===2?'日主':SHISHEN_NAME[ts]),px[i],256);
  });
  // 分隔线
  ctx.strokeStyle='rgba(176,138,62,.35)'; ctx.beginPath(); ctx.moveTo(60,282); ctx.lineTo(700,282); ctx.stroke();
  // 命格信息
  ctx.textAlign='left';
  const rows=[
    ['提 纲',synthesis.pattern+'（'+gj.state+'）'],
    ['身强弱',strengthLabel(zh)+' · 用神'+WUXING[zh.yongShen]],
    ['旧规则演示分（未校准）',dd.score+' / 100 · 质地'+(dd.score>=80?'绝':dd.score>=60?'良':'凡')],
    ['大 运',zh.dy.startAge+'岁起运·'+(zh.dy.forward?'顺行':'逆行')+' · 当前'+(function(){const now=new Date().getFullYear();const age=now-zh.date.getFullYear()-((new Date().getMonth()<zh.date.getMonth())?1:0);let cur=zh.dy.dyList[0];zh.dy.dyList.forEach(dy=>{if(age>=dy.age)cur=dy;});return GAN[cur.g]+ZHI[cur.z]+'（'+cur.age+'-'+cur.endAge+'岁）';})()],
    ['五 行',WUXING.map((w,i)=>w+zh.wxCount[i]).join(' ')+(zh.tiaoHouWX>=0?' · 调候'+WUXING[zh.tiaoHouWX]:'')]
  ];
  let ry=312;
  rows.forEach(rw=>{
    ctx.fillStyle='#b08a3e'; ctx.font='bold 14px sans-serif'; ctx.fillText(rw[0],70,ry);
    ctx.fillStyle='#26221c'; ctx.font='14px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillText(rw[1],160,ry);
    ry+=30;
  });
  // 底部
  ctx.fillStyle='#9a9280'; ctx.font='11px sans-serif'; ctx.textAlign='center';
  ctx.fillText('玄机命理排盘 · 传统命理文化参考 · 仅供娱乐',380,446);
  // 下载
  try{
    const a=document.createElement('a');
    a.download='命盘速览_'+(lastName||'命盘')+'_'+fmtLocalDate(zh.date)+'.png';
    a.href=cv.toDataURL('image/png');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }catch(e){ alert('导出失败：'+e.message); }
}
// 排盘记录导出 JSON
function exportRecords(){
  try{
    const data=createRecordBackup();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    if(blob.size>BACKUP_MAX_BYTES)throw new Error('备份超过2MB，请使用统一记录管理分批导出');
    const a=document.createElement('a');
    a.download='命理排盘备份_'+fmtLocalDate(new Date())+'.json';
    a.href=URL.createObjectURL(blob);
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }catch(e){alert('备份导出失败：'+e.message);}
}
// 导入备份
function importRecords(input){
  const f=input.files&&input.files[0];if(!f)return;
  if(f.size>BACKUP_MAX_BYTES){alert('备份文件超过2MB，请检查文件');input.value='';return;}
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const data=JSON.parse(rd.result),n=restoreRecordBackup(data);
      renderRecords();['zw','bz','qm','ly'].forEach(renderModRecords);
      alert('✅ 备份导入成功（'+n+'类记录），已恢复到当前版本');
    }catch(e){alert('导入失败：'+e.message);}
    input.value='';
  };
  rd.onerror=()=>{alert('备份文件读取失败，请重试');input.value='';};
  rd.readAsText(f);
}

/* ======================== 合婚 Prompt 提取 / 回填（无 Key 双通道） ======================== */
// v5.12 深化prompt: 完整盘面+盘面事实+研判准则, 不注硬分数 → AI独立研判
function hhFullSide(z,n){
  try{
    const gz=z.pillars.map(p=>GAN[p[0]]+ZHI[p[1]]).join(' ');
    const d1h=ZHI_HIDDEN[z.dayGZ[1]]?ZHI_HIDDEN[z.dayGZ[1]][0]:-1;
    const fqTs=d1h>=0?SHISHEN_NAME[tenGod(z.dg,d1h)]:'';
    const ps=z.gender===1?[4,5]:[6,7];
    const peiOu=z.gender===1?'财星（妻星）':'官星（夫星）';
    const tou=[z.yearGZ[0],z.monthGZ[0],z.hourGZ[0]].map(g=>SHISHEN_NAME[tenGod(z.dg,g)]).join('、');
    const ny=nayinOf(z.yearGZ[0],z.yearGZ[1]);
    const gua=getMingGua(z.date.getFullYear(),z.gender).replace(/\(.*?\)/,'');
    const east=['坎卦','离卦','震卦','巽卦'].includes(gua);
    const mingStar=z.mingStars&&z.mingStars.length?z.mingStars.map(k=>ZW_STARS[k].name).join('、'):'主星不现';
    const age=new Date().getFullYear()-z.date.getFullYear();
    const curDy=z.dy&&z.dy.dyList?z.dy.dyList.find(d=>age>=d.age&&age<=d.endAge):null;
    const dyTxt=curDy?(GAN[curDy.g]+ZHI[curDy.z]+'运·'+SHISHEN_NAME[tenGod(z.dg,curDy.g)]):'—';
    let s='【'+n+'】（'+(z.gender===1?'男':'女')+'命）\n四柱：'+gz+'（日主'+GAN[z.dg]+(GAN_YIN[z.dg]?'阳':'阴')+'·'+strengthLabel(z)+'·用神'+WUXING[z.yongShen]+'·农历'+z.lunar.year+'年'+lunarMonthName(z.lunar.month,z.lunar.isLeap)+lunarDayName(z.lunar.day)+'）\n';
    s+='配偶星（'+peiOu+'）状态：四柱天干透出十神为'+tou+'；日支（夫妻宫）坐'+ZHI[z.dayGZ[1]]+'，本气为日主之'+fqTs+(d1h>=0&&ps.includes(tenGod(z.dg,d1h))?'（配偶星正坐夫妻宫）':'')+(tou&&tou.split('、').some(t=>{const idx=SHISHEN_NAME.indexOf(t);return idx>=0&&ps.includes(idx);})?'（配偶星透干）':'')+'；\n';
    s+='年命纳音：'+ny+'；九星命卦：'+gua+'（'+(east?'东四命':'西四命')+'）；紫微命宫：'+ZHI[z.mingGong]+'坐'+mingStar+'；当前大运：'+dyTxt+'；\n';
    s+='出生地：'+(z.place||'未填');
    if(z.place){
      const pf=zhPlaceFull(z.place);
      if(pf) s+='（复合五行 '+zhPlaceFullName(pf.wx,pf.sub)+' · '+CITY_WX_DIR[pf.wx]+'）';
      if(z.tiaoHouPlaceNote) s+='；调候：'+z.tiaoHouPlaceNote;
    }
    return s;
  }catch(e){ return '【'+n+'】排盘数据'; }
}
function hhPromptBody(A,B,r){
  const facts=r.aspects.map(a=>'· '+a.k+'：'+a.name+'——'+a.desc).join('\n');
  return '【甲方完整命盘】\n'+hhFullSide(A.zh,A.name||'甲方')+'\n\n'+
    '【乙方完整命盘】\n'+hhFullSide(B.zh,B.name||'乙方')+'\n\n'+
    '【确定性盘面事实（仅供核对，勿直接引用为结论）】\n'+facts+'\n\n'+
    (hhDeepText(r)?('【深度研判数据（核心法门，优先引用并深化）】\n'+hhDeepText(r)+'\n\n'):'')+
    '【研判准则（权重参考，请自行权衡推导，勿直接引用为分数）】\n'+
    '· 地支六合主和顺亲合、六冲主碰撞分歧、三合半合主互助有情、六害主暗耗摩擦、三刑主纠葛反复——吉凶须结合所涉宫位（年=两族根基/月=成长背景/日=夫妻宫/时=子女）与十神性质综合判定；\n'+
    '· 配偶星（男财女官）正坐夫妻宫且透干得地者，为正缘归位、婚缘根基深厚；不归位者婚缘多靠大运流年引动；\n'+
    '· 日主天干五合（天地鸳鸯合）为上吉；日主一阴一阳则阴阳互济、刚柔相补；\n'+
    '· 用神互补、五行补缺者婚后能量互济，气场更完整；纳音年命相生比和为佳，相克者宜缓；\n'+
    '· 九星同东四/西四命者宅运相合，异组者起居习惯须迁就；紫微命宫星曜有情组合（日月辉映/紫府同气等）者性情呼应；\n'+
    '· 双方当前大运同为喜用则同频顺遂，同处低谷则相扶更贵；婚期窗口以双方配偶星透干流年与桃花年重叠者为良机；\n'+
    '· 出生地复合五行与调候：地域气候补对方寒暖之需者，同居气场舒坦。';
}
function hhBuildPromptText(){
  const A=hhReadSide('1'), B=hhReadSide('2');
  if(!A||!B) return null;
  const r=heHunCompute(A.zh,B.zh,A.name,B.name);
  const p='【角色设定】你是一位精通传统合婚文化的命理研究者，深谙《三命通会》合婚法、《滴天髓》阴阳观与子平十神论。\n'+
  '【任务】基于双方完整命盘，独立研判这段姻缘，输出五段：【相处模式】【感情浓度】【潜在矛盾点】【经营建议】【综合断】，每段150-260字。要求：\n'+
  '1) 不依赖任何既有评分，自行从干支十神、合冲刑害、配偶星归位、阴阳纳音、紫微命卦等原始盘面推导，推断过程可见；\n'+
  '2) 每段引用双方具体干支十神（如"甲方丁火日主见乙方壬水正官"）与具体合冲关系作依据；\n'+
  '3) 【综合断】给出缘分档位定性（上等/中上/中平/磨合/慎配）与一句总判，不必给出精确分数；\n'+
  '4) 语言专业而有温度，结论只作倾向参考，禁止"必定离婚/注定不和"式断言。\n\n'+
  hhPromptBody(A,B,r)+'\n\n'+
  '请基于以上完整盘面与准则，给出深度合婚研判。';
  return p;
}
function hhExtractPrompt(){
  const p=hhBuildPromptText();
  if(!p) return;
  const box=document.getElementById('hh-prompt-box');
  const ta=document.getElementById('hh-prompt-text');
  if(box) box.style.display='block';
  if(ta) ta.value=p;
  const msg=document.getElementById('hh-prompt-msg');
  if(msg) msg.textContent='✅ 已生成，请复制或全选拷贝';
  try{document.getElementById('hh-prompt-box').scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){}
}
function hhCopyPrompt(){
  const ta=document.getElementById('hh-prompt-text');
  if(!ta||!ta.value){alert('请先点击「📋 提取 Prompt」生成内容');return;}
  ta.select();
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(ta.value).then(()=>{const m=document.getElementById('hh-prompt-msg');if(m)m.textContent='✅ 已复制到剪贴板';}); }
    else if(document.execCommand('copy')){const m=document.getElementById('hh-prompt-msg');if(m)m.textContent='✅ 已复制';}
    else{alert('复制失败，请手动 Ctrl+C');}
  }catch(e){ alert('复制失败，请手动全选复制'); }
}
// v5.11/v5.13 AI合婚解读五段解析: 兼容【相处模式】/ **相处模式** / ### 相处模式 / 一、相处模式 / 1. 相处模式 / 相处模式： 等格式
function hhParseDims(text){
  const order=['相处模式','感情浓度','潜在矛盾点','经营建议','综合断'];
  const dims={};
  if(!text||!text.trim()) return dims;
  // ① 标准【】正则(允许段名内空白、段名后冒号)
  const re=/【\s*(相处模式|感情浓度|潜在矛盾点|经营建议|综合断)\s*】\s*[:：]?\s*([\s\S]*?)(?=【\s*(?:相处模式|感情浓度|潜在矛盾点|经营建议|综合断)\s*】|$)/g;
  let m;
  while((m=re.exec(text))){
    const idx=order.indexOf(m[1]);
    if(idx>=0&&m[2].trim()) dims[idx]=m[2].trim();
  }
  // ② 宽松兜底(标准未抓全时): 行首段名扫描, 兼容序号/markdown/冒号分隔
  if(Object.keys(dims).length<5){
    const tail=['：',':',' ','　','】','）',')','*','.','．','。','、','-','—'];
    const lines=text.split('\n');
    let cur=-1;
    const buf=[];
    for(const raw of lines){
      // 去行首符号/序号(含中文序号与markdown标记), 去行尾空白
      const l=raw.replace(/^[\s>#*\-•\d一二三四五六七八九十、\.．（）()【】\[\]]+|[\s*]+$/g,'');
      let hit=-1;
      for(let i=0;i<5;i++){
        if(l.startsWith(order[i])){
          const rest=l.slice(order[i].length);
          if(rest===''||tail.includes(rest[0])){ hit=i; break; }
        }
      }
      if(hit>=0){
        cur=hit; buf[hit]=[];
        // 段名与内容同行时("1. 相处模式：互补。"), 冒号后的内容也入库
        const rest=l.slice(order[hit].length).replace(/^[:：、\s.\-—）】)*]+/,'');
        if(rest) buf[hit].push(rest);
      }
      else if(cur>=0) buf[cur].push(raw);
    }
    for(let i=0;i<5;i++){
      if(!dims[i]&&buf[i]&&buf[i].length){
        const txt=buf[i].join('\n').trim();
        if(txt) dims[i]=txt;
      }
    }
  }
  return dims;
}
// v5.11 回填五段卡片(同综合解读18维卡模式, 点亮徽章+边框)
function hhFillCards(dims){
  const box=document.getElementById('hh-ai-cards');
  if(!box) return 0;
  const meta=[['💬','相处模式','var(--teal)'],['💗','感情浓度','var(--pink)'],['⚠️','潜在矛盾点','var(--orange)'],['📋','经营建议','var(--blue)'],['🎯','综合断','var(--gold)']];
  let n=0;
  for(let i=0;i<5;i++){
    const el=document.getElementById('hh-dim-'+i);
    if(!el) continue;
    const body=el.querySelector('.hh-dim-body');
    if(dims[i]){
      if(body) body.innerHTML=aiMd2Html(dims[i]);
      const badge=el.querySelector('.hh-dim-badge');
      if(badge){badge.style.display='inline-block';badge.textContent='AI深度';}
      el.style.borderColor=meta[i][2];
      n++;
    }
  }
  if(n) box.style.display='block';
  return n;
}
function hhApplyReply(){
  const ta=document.getElementById('hh-reply-text');
  const box=document.getElementById('hh-ai-box');
  const text=ta?ta.value:'';
  if(!text.trim()){alert('请先粘贴 AI 的完整回复');return;}
  if(box) box.innerHTML=aiMd2Html(text);
  let n=0; try{ n=hhFillCards(hhParseDims(text)); }catch(e){}
  const msg=document.getElementById('hh-prompt-msg');
  if(msg) msg.textContent='✅ 已回填解读（AI 通道）'+(n>0?(' · '+n+' 张卡片已点亮'):'；未识别到五段标记，仅保留正文');
}

/* ======================== Tab切换 ======================== */
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('panel-'+t.dataset.tab).classList.add('active');
  });
});

/* ======================== 初始化 ======================== */
initializeCalculationControls();
initHours();
const today=beijingNow();
const ds=fmtLocalDate(today);
['bz-date','zw-date','qm-date','ly-date','zh-solar','hh1-date','hh2-date'].forEach(id=>{const el=document.getElementById(id); if(el) el.value=ds;});
['bz-hour','zw-hour','qm-hour','ly-hour','zh-hour','hh1-hour','hh2-hour'].forEach(id=>{const el=document.getElementById(id); if(el) el.value=Math.floor((today.getHours()+1)/2)%12;});
// 合婚: 乙方默认用与甲方不同的时辰(常见异性样本), 便于直接体验
(function(){const el1=document.getElementById('hh2-hour'); if(el1){el1.value=(Math.floor((today.getHours()+1)/2)+6)%12;}})();
const qmTimeEl=document.getElementById('qm-time');
if(qmTimeEl) qmTimeEl.value=String(today.getHours()).padStart(2,'0')+':'+String(today.getMinutes()).padStart(2,'0');
lyModeChange(); // 初始化六爻起卦方式状态
['zh','bz','hh1','hh2'].forEach(prefix=>{
  const time=document.getElementById(prefix+'-time'),hour=document.getElementById(prefix+'-hour');
  hour.addEventListener('change',()=>{time.value='';});
  time.addEventListener('change',()=>{if(time.value){const [h]=time.value.split(':').map(Number);hour.value=Math.floor((h+1)/2)%12;}});
});
const minuteSel=document.getElementById('zh-minute');
minuteSel.replaceChildren(...Array.from({length:60},(_,i)=>{const o=document.createElement('option');o.value=i;o.textContent=String(i).padStart(2,'0');return o;}));
minuteSel.value=0;
document.getElementById('zh-time').value=String(today.getHours()).padStart(2,'0')+':'+String(today.getMinutes()).padStart(2,'0');
// 综合排盘: 默认显示今日盘
zhToggleCal();
zhSyncFromSolar();
zhCast();
// 加载历史排盘记录
renderRecords();
['zw','bz','qm','ly'].forEach(mod=>renderModRecords(mod));

initializeWorkbench();
window.addEventListener('pagehide',aiEvidenceCancel);

/* ============ v2 可访问性 & UX（2026-08-28） ============ */
(function(){
  // 1) 键盘可达: Tab/主题点/历史记录/过三关条目按 Enter/Space 触发点击
  document.addEventListener('keydown', function(e){
    if(e.key!=='Enter' && e.key!==' '){ return; }
    var t=e.target;
    if(!t || !t.classList){ return; }
    var hit = t.classList.contains('tab') || t.classList.contains('theme-dot')
           || t.classList.contains('rec-item') || t.classList.contains('gsg-item')
           || (t.getAttribute && t.getAttribute('role')==='button');
    if(hit){ e.preventDefault(); t.click(); }
  });
  // 2) 返回顶部按钮
  var bt=document.getElementById('back-top');
  if(bt){
    var onScroll=function(){
      var doc=document.documentElement;
      var st=doc?doc.scrollTop:0;
      var show=(window.scrollY||st)>560;
      if(show) bt.classList.add('show'); else bt.classList.remove('show');
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
    bt.addEventListener('click',function(){
      var reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduce){ window.scrollTo(0,0); }
      else{ window.scrollTo({top:0,behavior:'smooth'}); }
    });
  }
})();

function temporalDescription(zh){
  const t=zh.temporal;if(!t)return '';
  const pad=n=>String(n).padStart(2,'0');
  const fmt=d=>fmtLocalDate(d)+' '+pad(d.getHours())+':'+pad(d.getMinutes());
  let note='输入钟表 '+fmt(t.inputDate||t.civilDate)+' '+utcOffsetLabel(t.utcOffsetMinutes??480)+(t.dstMinutes?'，夏令时快1小时（已扣除）':'')+'；统一东八区 '+fmt(t.civilDate)+'；'+dayBoundaryLabel(t.dayBoundary);
  if(t.correction){const c=t.correction;note+='；真太阳时 '+fmt(t.effectiveDate)+'（经度修正 '+c.longitudeMin.toFixed(2)+'分，近似均时差 '+c.equationMin.toFixed(2)+'分，跨日 '+c.dayOffset+'天）；年/月柱仍按标准时交节瞬间判断';}
  return note+(zh.precisionNote?'；'+zh.precisionNote:'')+(zh.genderUnspecified?'；性别未提供，大运按男命规则示例，性别相关解释待核对':'');
}

function genderLabel(zh){return zh.genderUnspecified?'未提供（按男命规则示例）':zh.gender===1?'男':'女';}
