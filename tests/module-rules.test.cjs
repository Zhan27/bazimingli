const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),e=loadEngine(),api=require('../lib/index.cjs');
test('three fair coins enumerate the exact 1:3:3:1 back-count distribution',()=>{
  const counts=[0,0,0,0];for(let mask=0;mask<8;mask++){e.context.bits=[0,1,2].map(i=>(mask>>i)&1?0.75:0.25);counts[e.run('tossLiuyaoCoins(()=>bits.shift())')]++;}
  assert.deepEqual(counts,[1,3,3,1]);assert.throws(()=>e.run('tossLiuyaoCoins(()=>1)'));
});
test('Meihua time calculation reproduces the classical GuanMei and MuDan examples',()=>{
  const cases=[[2024,12,17,8,'泽火革','泽山咸',1],[2025,3,16,3,'天风姤','火风鼎',5]];
  for(const [y,m,d,h,name,changed,moving] of cases){e.context.f={y,m,d,h};const r=e.json(`(()=>{const date=lunar2solar(f.y,f.m,f.d);const q=calculateLiuyao({dateStr:fmtLocalDate(date),hourIdx:f.h});return {name:GUA_NAMES[q.upGua*8+q.downGua],changed:GUA_NAMES[q.changeUp*8+q.changeDown],moving:q.dongYao}})()`);assert.deepEqual(r,{name,changed,moving});}
  const r=api.calculateModule('liuyao',{date:'2024-02-10',mode:1,numStr:'1 8 6'}).result;
  assert.equal(e.run(`GUA_NAMES[${r.upGua*8+r.downGua}]`),'天地否');assert.equal(r.dongYao,6);
  assert.equal(api.calculateModule('liuyao',{date:'2024-02-10',mode:1,numStr:'1 8 6',ruleMode:'legacy'}).result.upGua,1);
});
test('every coin sequence preserves all moving positions and natal-palace kinship, with no invented day spirits',()=>{
  e.run(`var sequencesOK=true;for(let n=0;n<4096;n++){let x=n;const seq=Array.from({length:6},()=>{const v=x%4;x=Math.floor(x/4);return v;});const r=calculateLiuyao({mode:2,yaoSeq:seq});for(let i=0;i<6;i++){const move=seq[i]===0||seq[i]===3;if(r.lines[i].moving!==move||r.changedSix[i]!==((seq[i]>=2?1:0)^(move?1:0))||r.lines[i].shen!==null)sequencesOK=false;}if(!SHIYING_TABLE[r.upGua*8+r.downGua])sequencesOK=false;}`);
  assert.equal(e.run('sequencesOK'),true);assert.equal(e.run('Object.keys(SHIYING_TABLE).length'),64);
});
test('six spirits start at the initial line, while month/day facts use exact Jie and chosen late-Zi boundary',()=>{
  e.run(`var lyDay=Array.from({length:60},(_,i)=>{const d=civilFromMillis(Date.UTC(2024,0,1+i));return {date:fmtLocalDate(d),g:getDayGZ(d)[0]};}).find(x=>x.g===0).date`);
  const r=e.json(`calculateLiuyao({dateStr:lyDay,mode:2,yaoSeq:[2,2,2,2,2,2]})`);
  assert.equal(r.lines[0].shen,'青龙');assert.equal(r.lines[5].shen,'玄武');assert.equal(r.lines[0].qin,'子孙');
  const a=api.calculateModule('liuyao',{date:'2024-02-10',time:'23:30'}).result,b=api.calculateModule('liuyao',{date:'2024-02-10',time:'23:30',options:{dayBoundary:'zi-zheng'}}).result;
  assert.notDeepEqual(Array.from(a.dayGZ),Array.from(b.dayGZ));assert.equal(a.rules.dayBoundary,'zi-chu');
  const times=e.json(`(()=>{const t=solarTermMoment(2024,2);return [-1,1].map(delta=>{const d=civilFromMillis(civilMillis(t)+delta*60000);return {date:fmtLocalDate(d),time:unknownClock(civilMillis(d)).slice(11,16)};});})()`);
  const before=api.calculateModule('liuyao',{...times[0]}).result,after=api.calculateModule('liuyao',{...times[1]}).result;assert.notEqual(before.monthGZ[1],after.monthGZ[1]);
});
test('pair branch tables are symmetric for all144 combinations and agree with known union/harm pairs',()=>{
  for(let a=0;a<12;a++)for(let b=0;b<12;b++)assert.equal(e.run(`JSON.stringify(hhRel(${a},${b}))`),e.run(`JSON.stringify(hhRel(${b},${a}))`));
  for(const [a,b] of [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]])assert.equal(e.run(`hhRel(${a},${b}).k`),'liuhe');
  for(const [a,b] of [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]])assert.equal(e.run(`hhRel(${a},${b}).k`),'hai');
  assert.equal(e.run('hhRel(0,5).k'),'none');assert.equal(e.run('hhRel(2,2).k'),'none');
  for(let z=0;z<12;z++)assert.equal(e.run(`hhTaoHua(${z})`),[9,6,3,0,9,6,3,0,9,6,3,0][z]);
});
test('pair API is DOM-free, deterministic by target year, symmetric in score and exposes its complete ledger',()=>{
  const a={date:'1990-05-17',time:'12:00',gender:1},b={date:'1992-01-15',time:'20:00',gender:0};
  const r=api.comparePair(a,b,2024).comparison,swap=api.comparePair(b,a,2024).comparison;
  assert.equal(r.score,swap.score);assert.equal(r.referenceYear,2024);assert.equal(r.rules.version,'5.27.0');
  assert.equal(r.rawScore,r.ledger.base+r.ledger.items.reduce((sum,i)=>sum+i.delta,0));assert.equal(r.score,Math.max(30,Math.min(95,r.rawScore)));
  assert.equal(JSON.stringify(r),JSON.stringify(api.comparePair(a,b,2024).comparison));assert.notEqual(r.deep[2].html,api.comparePair(a,b,2034).comparison.deep[2].html);
  assert.throws(()=>api.comparePair(a,b,NaN));
});
test('Qimen FuTou yuan is determined from the complete60 day cycle, not distance from a solar term',()=>{
  const expected=['上元','中元','下元'];
  e.run('var qmCycleStart=parseCivilDate("2024-01-01")');
  for(let n=0;n<60;n++){
    const r=e.json(`(()=>{const d=civilFromMillis(civilMillis(qmCycleStart)+${n}*86400000),gz=getDayGZ(d),idx=gzIndex(...gz),head=indexToGZ(idx-idx%5);return {head:head[1],yuan:qmGetYuan(d,0)};})()`);
    const label=[0,3,6,9].includes(r.head)?'上元':[2,5,8,11].includes(r.head)?'中元':'下元';assert.equal(expected[r.yuan],label);
  }
});
test('Qimen twelve layers follow independent star/door destinations, six hidden Jia, rings and carried center',()=>{
  const ring=[1,8,3,4,9,2,7,6],names=['天蓬','天任','天冲','天辅','天英','天芮／天禽','天柱','天心'];
  assert.deepEqual(e.json('placeStarsTian(1,8)'),{1:'天心',2:'天英',3:'天任',4:'天冲',5:'天禽（寄天芮）',6:'天柱',7:'天芮／天禽',8:'天蓬',9:'天辅'});
  for(const yang of [true,false])for(let ju=1;ju<=9;ju++)for(let head=0;head<6;head++){
    const p=e.json(`placeYi(${ju},${yang})`),stem=['戊','己','庚','辛','壬','癸'][head],origin=Number(Object.keys(p).find(k=>p[k]===stem));assert.ok(origin>=1&&origin<=9);
    const stars=e.json(`placeStarsTian(${origin},8)`);assert.equal(stars[8],origin===5?'天芮／天禽':names[ring.indexOf(origin)]);
  }
  const r=api.calculateModule('qimen',{date:'2024-02-10',time:'04:00'}).result;
  assert.equal(r.palaces.length,9);assert.equal(r.diPan[r.zfGong],r.xunYi);assert.equal(r.palaces.filter(p=>p.zhiFu).length,1);assert.equal(r.palaces.filter(p=>p.zhiShi).length,1);
  assert.equal(new Set(Object.values(r.baMen).filter(Boolean)).size,8);assert.equal(new Set(Object.values(r.baShen)).size,8);assert.equal(Object.keys(r.tianGan).length,8);
  // 遁甲演義卷二: 阳一甲己日丙寅，蓬临艮八；阴九甲己日丙寅，英临坤二、景临兑七。
  const winter=api.calculateModule('qimen',{date:'2024-01-01',time:'04:00'}).result,summer=api.calculateModule('qimen',{date:'2024-06-29',time:'04:00'}).result;
  assert.equal(winter.juInfo.ju,1);assert.equal(winter.tianPan[8],'天蓬');assert.equal(winter.baMen[3],'休门');
  assert.equal(summer.juInfo.ju,9);assert.equal(summer.tianPan[2],'天英');assert.equal(summer.baMen[7],'景门');
});
