/** Interpretation only: reads fixed placements without changing the Ziwei engine. */
const ZW_READING_VERSION='1.0.0';
const ZW_READING_PALACES=['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'];
const ZW_READING_THEMES={ziwei:'统筹与主导',tianji:'规划与应变',taiyang:'公开表达与投入',wuqu:'执行与资源管理',tiantong:'协调与生活节奏',lianzhen:'规则与边界',tianfu:'储备与组织',taiyin:'细致经营与积累',tanlang:'人际拓展与探索',jumen:'表达与辨析',tianxiang:'协调与章法',tianliang:'扶助与原则',qisha:'决断与开拓',pojun:'重组与变化'};
const ZW_READING_MINOR={zuoqu:'左辅',youbi:'右弼',wenchang:'文昌',wenqu:'文曲',tiankui:'天魁',tianyue:'天钺'};
const ZW_READING_FOCUS=['处事方式','同辈协作','沟通与双方分工','陪伴与教养','资源取得与配置','作息与日常照料','外部环境与行动','团队往来','职责与发展路径','居住与长期安排','休息与内在满足','长辈与支持系统'];
function buildZiweiReading(d){
  if(!d||![d.mingGong,d.shenGong].every(x=>Number.isInteger(x)&&x>=0&&x<12)||!d.stars)throw new TypeError('紫微提要需要有效命身宫与主星分布');
  const palaceIndex=pos=>(d.mingGong-pos+12)%12,palaceName=pos=>ZW_READING_PALACES[palaceIndex(pos)];
  const at=pos=>Object.keys(ZW_STARS).filter(key=>d.stars[key]===pos).map(key=>({key,name:ZW_STARS[key].name,position:pos}));
  const minor=Object.entries(ZW_READING_MINOR).filter(([key])=>Number.isInteger(d.minorStars?.[key])).map(([key,name])=>({key,name,position:d.minorStars[key]}));
  const starPositions=[...Object.keys(ZW_STARS).map(key=>({key,name:ZW_STARS[key].name,position:d.stars[key]})),...minor];
  const transforms=(names,scope)=>names?.map((name,i)=>{const star=starPositions.find(s=>s.name===name),pos=star?.position,known=Number.isInteger(pos)&&pos>=0&&pos<12;return {star:name,kind:['禄','权','科','忌'][i],scope,year:scope==='annual'?d.referenceYear:null,position:known?pos:null,palace:known?palaceName(pos):null,focus:known?ZW_READING_FOCUS[palaceIndex(pos)]:'当前摘要未定位',meaning:['机会与资源','推进与责任','表达与认可','牵挂与调整'][i]};})||[];
  const natal=transforms(d.siHua,'natal'),annual=transforms(d.liuNianSiHua,'annual');
  const frame=pos=>{
    const resident=at(pos),opposite=(pos+6)%12,borrowed=resident.length?[]:at(opposite),readingStars=resident.length?resident:borrowed;
    const companions=minor.filter(s=>s.position===pos).map(s=>s.name);if(d.luCun===pos)companions.push('禄存');
    const tensions=Object.entries({qingYang:'擎羊',tuoLuo:'陀罗',huoXing:'火星',lingXing:'铃星',tianKong:'天空',diJie:'地劫'}).filter(([key])=>d[key]===pos).map(([,name])=>name);
    const name=palaceName(pos),fact=name+ZHI[pos]+' · '+(resident.length?resident.map(s=>s.name).join('、'):'空宫'+(borrowed.length?'，参看对宫'+palaceName(opposite)+ZHI[opposite]+'的'+borrowed.map(s=>s.name).join('、'):'，联看三方'));
    return {position:pos,name,resident,borrowed,readingStars,companions,tensions,fact,theme:readingStars.length?readingStars.map(s=>ZW_READING_THEMES[s.key]).join('、'):'从三方星曜及四化梳理',focus:ZW_READING_FOCUS[palaceIndex(pos)],natal:natal.filter(h=>h.position===pos),cross:[pos,(pos+4)%12,(pos+8)%12,opposite].map(position=>({position,palace:palaceName(position),stars:at(position).map(s=>s.name)}))};
  };
  const ming=frame(d.mingGong),body=frame(d.shenGong),wealth=frame((d.mingGong-4+12)%12),career=frame((d.mingGong-8+12)%12),relationship=frame((d.mingGong-2+12)%12),fortune=frame((d.mingGong-10+12)%12),travel=frame((d.mingGong-6+12)%12);
  const wording=f=>f.fact+'：'+f.theme;
  const rows=[{label:'命身',text:'命宫以'+ming.theme+'为处事主线；'+(body.position===ming.position?'命身同宫，行动重心与此呼应。':'身宫落'+body.name+ZHI[body.position]+'，行动重心落在'+body.focus+'。')},{label:'财官',text:wording(wealth)+'；'+wording(career)+'。'},{label:'相处',text:wording(relationship)+'；'+wording(fortune)+'。'}];
  const combinations=[];
  for(const f of [ming,wealth,career,relationship,fortune,travel])if(f.resident.some(s=>s.key==='ziwei')&&f.resident.some(s=>s.key==='tianfu'))combinations.push({name:'紫府同宫',palace:f.name,position:f.position,evidence:f.resident.map(s=>s.name),reading:'统筹与储备相接，继续看辅弼及四化如何承接。'});
  return {version:ZW_READING_VERSION,ming,body,wealth,career,relationship,fortune,travel,headline:ming.fact+'；'+(body.position===ming.position?'命身同宫':'身宫在'+body.name+ZHI[body.position])+'。',rows,natal,annual,combinations,frames:[ming,wealth,career,relationship,fortune,travel],sources:[{title:'《紫微斗数全书》卷一 · 诸星问答论',url:'https://zh.wikisource.org/wiki/紫微斗數全書/卷一'},{title:'《紫微斗数全书》卷三 · 谈星要论',url:'https://zh.wikisource.org/wiki/紫微斗數全書/卷三'}]};
}
function ziweiReadingText(reading){
  const hua=h=>h.star+'化'+h.kind+' → '+(h.palace? h.palace+ZHI[h.position]:'未定位')+'（'+h.meaning+'；'+h.focus+'）';
  return [reading.headline,...reading.rows.map(r=>r.label+'：'+r.text),'生年四化：'+reading.natal.map(hua).join('；'),...(reading.combinations.map(c=>c.name+'在'+c.palace+ZHI[c.position]+'：'+c.reading))].join('\n');
}
function renderZiweiReading(reading,{embedded=false}={}){
  const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hua=h=>e(h.star+'化'+h.kind)+' → '+e(h.palace?h.palace+ZHI[h.position]:'未定位')+' <small>'+e(h.meaning+' · '+h.focus)+'</small>';
  return '<section class="section-block zw-reading'+(embedded?' zw-reading-embedded':'')+'" data-zw-reading-version="'+reading.version+'"><h3>'+(embedded?'紫微斗数参考 · 命盘提要':'紫微提要 · 先看命身，再读财官')+'</h3><p class="zw-reading-headline">'+e(reading.headline)+'</p>'+reading.rows.map(r=>'<div class="zw-reading-row"><b>'+r.label+'</b><span>'+e(r.text)+'</span></div>').join('')+'<details class="zw-reading-evidence"><summary>展开落宫依据 · 三方四正与四化</summary>'+reading.frames.map(f=>'<div class="zw-reading-fact"><b>'+e(f.fact)+'</b><p>三方四正：'+e(f.cross.map(p=>p.palace+ZHI[p.position]+'（'+(p.stars.join('、')||'空宫')+'）').join('；'))+'</p><p>'+e('同宫辅曜：'+(f.companions.join('、')||'无')+'；同宫张力星：'+(f.tensions.join('、')||'无'))+'</p></div>').join('')+'<h4>生年四化 · 本命关注点</h4>'+reading.natal.map(h=>'<p>'+hua(h)+'</p>').join('')+(reading.annual.length?'<h4>'+e(reading.annual[0].year)+'年四化 · 当年观察</h4>'+reading.annual.map(h=>'<p>'+hua(h)+'</p>').join(''):'')+reading.combinations.map(c=>'<p><b>'+e(c.name+' · '+c.palace+ZHI[c.position])+'</b> '+e(c.reading)+'</p>').join('')+'<p class="module-citations">'+reading.sources.map(s=>'<a href="'+e(s.url)+'" target="_blank" rel="noopener noreferrer">'+e(s.title)+'</a>').join(' · ')+'<br>星性与生活主题为应用整理，按本盘落宫展开。</p></details></section>';
}
