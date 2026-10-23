const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),api=require('../lib/index.cjs'),e=loadEngine({ui:true});
// Independently transcribed branch sequences from 紫微斗數全書/卷二; not copied code.
// https://zh.wikisource.org/wiki/紫微斗數全書/卷二 — 安文昌文曲、安紅鸞天喜、安十二宮太歲殺祿訣
const branches='子丑寅卯辰巳午未申酉戌亥';
test('Chang/Qu follow the complete twelve-hour classical sequences, including derived EnGuang/TianGui',()=>{
  const chang='戌酉申未午巳辰卯寅丑子亥',qu='辰巳午未申酉戌亥子丑寅卯';
  for(let h=0;h<12;h++){
    const z=api.calculateModule('ziwei',{date:'2024-02-10',hourIdx:h,referenceYear:2026}).result;
    assert.equal(branches[z.minorStars.wenchang],chang[h]);assert.equal(branches[z.minorStars.wenqu],qu[h]);
    assert.equal(z.enGuang,(branches.indexOf(chang[h])+11)%12);assert.equal(z.tianGui,(branches.indexOf(qu[h])+11)%12);
  }
});
test('HongLuan and TianXi cover all twelve year branches, with a six-palace opposition',()=>{
  const hong='卯寅丑子亥戌酉申未午巳辰',xi='酉申未午巳辰卯寅丑子亥戌';
  for(let i=0;i<12;i++){
    const r=e.json(`placeHongLuanTianXi(${i})`);assert.equal(branches[r.hongLuan],hong[i]);assert.equal(branches[r.tianXi],xi[i]);
    const chart=api.calculateModule('ziwei',{date:`${2020+i}-06-15`,referenceYear:2026}).result;
    assert.equal(chart.hongLuan,r.hongLuan);assert.equal(chart.tianXi,r.tianXi);
  }
});
test('all twelve BoShi stars start at LuCun and follow both genders and every year stem',()=>{
  const lu=[2,3,5,6,5,6,8,9,11,0],keys=['boShi','liShi','qingLong','xiaoHao2','jiangJun','zouShu','feiLian2','xiShen2','bingFu2','daHao2','fuBing','guanFu2'];
  for(let g=0;g<10;g++)for(const gender of [0,1]){
    const chart=api.calculateModule('ziwei',{date:`${2024+g}-06-15`,gender,referenceYear:2026}).result;
    const direction=(g%2===0&&gender===1)||(g%2===1&&gender===0)?1:-1;
    assert.equal(chart.luCun,lu[g]);keys.forEach((key,i)=>assert.equal(chart[key],(lu[g]+direction*i+12)%12,`${g}/${gender}/${key}`));
  }
});
test('annual labels use their own TaiSui while dated observations follow lunar New Year, not LiChun',()=>{
  const input={date:'1988-08-08',time:'12:00'},hua=[['廉贞','破军','武曲','太阳'],['天机','天梁','紫微','太阴'],['天同','天机','文昌','廉贞'],['太阴','天同','天机','巨门']];
  for(let i=0;i<4;i++){
    const z=api.calculateModule('ziwei',{...input,referenceYear:2024+i}).result;
    assert.deepEqual(Array.from(z.liuNianSiHua),hua[i]);assert.equal(z.referenceYear,2024+i);assert.equal(z.annualYearGZ[0],i);
  }
  for(const [referenceDate,year] of [['2024-02-04',2023],['2024-02-09',2023],['2024-02-10',2024],['2026-02-16',2025],['2026-02-17',2026]]){
    const z=api.calculateModule('ziwei',{...input,referenceYear:2027,referenceDate}).result;
    assert.equal(z.referenceYear,year);assert.equal(z.referenceDate,referenceDate);
    assert.deepEqual(z.stars,api.calculateModule('ziwei',{...input,referenceYear:2024}).result.stars);
  }
  for(const referenceDate of ['2024-02-30','bad',4])assert.throws(()=>api.calculateModule('ziwei',{...input,referenceDate}));
});
test('both Ziwei entry points share versioned rules and explicit annual labels without changing Bazi identities',()=>{
  const z=api.calculateModule('ziwei',{date:'2024-02-10',time:'00:00',referenceYear:2026}).result;
  e.context.zwFixture=z;
  assert.equal(e.run('RULE_VERSION'),'5.20.0');assert.equal(z.rules.version,'5.26.0');assert.equal(z.rules.leapMonth,'same-month');
  const result={innerHTML:''};e.context.document.getElementById=()=>result;e.run('renderZW(zwFixture)');
  assert.match(result.innerHTML,/流年四化（2026 丙午）/);
  assert.equal(e.run(`JSON.stringify(calculateZiwei({date:parseCivilDate('2024-02-10'),hourIdx:0,gender:1,referenceYear:2026}))`),JSON.stringify(z));
});
