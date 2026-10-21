/* ======================== 干支计算 ======================== */
// 日柱基准: 1900-01-31 = 甲辰(索引40)
const DAY_BASE_IDX=40;
// Single-entry caches use civil field keys, independent of browser UTC offset.
let _cKeyMonth=null,_cValMonth=null,_cKeyHour=null,_cValHour=null;
function getDayGZ(date){
  const days=Math.round((civilDay(date)-Date.UTC(1900,0,31))/86400000);
  return indexToGZ(days+DAY_BASE_IDX);
}
// 年柱: 以立春为界
function getYearGZ(date){
  const y=date.getFullYear();
  const yearNum=civilMillis(date)<solarTerms(y)[2]?y-1:y;
  return indexToGZ(yearNum-4);
}
// 月柱: 五虎遁年起月
function getMonthGZ(date){
  const k=civilMillis(date);
  if(_cKeyMonth===k) return _cValMonth;
  const termIdx=getTermIndex(date);
  const mz=getMonthZhi(termIdx);
  // 五虎遁: 年干甲己起丙寅,乙庚起戊寅,丙辛起庚寅,丁壬起壬寅,戊癸起甲寅
  const yearGZ=getYearGZ(date);
  const yg=yearGZ[0];
  const startGan=[2,4,6,8,0][yg%5]; // 甲己->丙(2),乙庚->戊(4)...
  let mg=(startGan+(mz-2+12)%12)%10;
  _cKeyMonth=k; _cValMonth=[mg,mz];
  return _cValMonth;
}
// 时柱: 五鼠遁日起时
function getHourGZ(date,hourZhiIdx){
  const k=civilDay(date)*12+hourZhiIdx;
  if(_cKeyHour===k) return _cValHour;
  // 五鼠遁: 甲己起甲子,乙庚起丙子,丙辛起戊子,丁壬起庚子,戊癸起壬子
  const dayGZ=getDayGZ(date);
  const dg=dayGZ[0];
  const startGan=[0,2,4,6,8][dg%5];
  const hg=(startGan+hourZhiIdx)%10;
  _cKeyHour=k; _cValHour=[hg,hourZhiIdx];
  return _cValHour;
}

/* ======================== 大运流年 ======================== */
function getDaYun(date,gender,yearGZ,school){
  // 阳男阴女顺排,阴男阳女逆排
  const yangNan=(GAN_YIN[yearGZ[0]]===1 && gender===1);
  const yinNan=(GAN_YIN[yearGZ[0]]===0 && gender===1);
  const yangNv=(GAN_YIN[yearGZ[0]]===1 && gender===0);
  const yinNv=(GAN_YIN[yearGZ[0]]===0 && gender===0);
  const forward=(yangNan||yinNv); // 顺排
  // 起运天数: 从出生到下一节(顺)或上一节(逆)的天数,3天一岁
  const y=date.getFullYear(), born=civilMillis(date);
  const boundaries=[y-1,y,y+1].flatMap(yy=>solarTerms(yy).filter((_,i)=>i%2===0)).sort((a,b)=>a-b);
  const target=forward?boundaries.find(t=>t>born):boundaries.filter(t=>t<=born).at(-1);
  const diffDays=Math.abs(target-born)/86400000;
  // 起运精确: 3日=1年,1日=4个月,1时辰=10天(未计时辰按整天)
  const startYears=Math.max(0,Math.floor(diffDays/3));
  const startMonths=Math.floor((diffDays%3)*4+1e-8); // 余日×4=月
  const startAge=Math.max(1,startYears+(startMonths>=6?1:0)); // 半年以上进位,至少1岁
  // 大运干支: 月柱顺/逆
  const monthGZ=getMonthGZ(date);
  const mIdx=gzIndex(monthGZ[0],monthGZ[1]);
  const dyList=[];
  for(let i=1;i<=8;i++){
    const dyIdx=forward?(mIdx+i):((mIdx-i+60)%60);
    const [g,z]=indexToGZ((dyIdx%60+60)%60);
    dyList.push({g,z,age:startAge+(i-1)*10,endAge:startAge+i*10-1,nayin:NAYIN[nayinIndex(g,z)]});
  }
  return {startAge,startYears,startMonths,forward,days:diffDays,dyList};
}
function getLiuNian(date,count){
  const y=date.getFullYear();
  const list=[];
  for(let i=-2;i<count;i++){
    const yy=y+i;
    const idx=((yy-4)%60+60)%60;
    const [g,z]=indexToGZ(idx);
    list.push({year:yy,g,z,nayin:NAYIN[nayinIndex(g,z)]});
  }
  return list;
}
// 流月: 以流年干五虎遁起寅月
function getLiuYue(yearGan,count){
  const startGan=[2,4,6,8,0][yearGan%5];
  const list=[];
  for(let i=0;i<count;i++){
    const g=(startGan+i)%10, z=(2+i)%12;
    list.push({g,z,nayin:NAYIN[nayinIndex(g,z)]});
  }
  return list;
}
// 流日: 从指定日期起N天
function getLiuRi(date,count){
  const list=[];
  for(let i=0;i<count;i++){
    const d=civilFromMillis(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()+i));
    const gz=getDayGZ(d);
    list.push({date:d,g:gz[0],z:gz[1]});
  }
  return list;
}
// 流时: 未来N天逐时辰(12时辰), 五鼠遁定天干
function getLiuShi(date,days,dayGan){
  const list=[];
  for(let i=0;i<days;i++){
    const d=civilFromMillis(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()+i));
    for(let h=0;h<12;h++){
      const gz=getHourGZ(d,h);
      list.push({date:d,hourIdx:h,g:gz[0],z:gz[1],tg:tenGod(dayGan,gz[0])});
    }
  }
  return list;
}

/* ======================== 神煞 ======================== */
const SHENSHA={
  tianyi:{name:"天乙贵人",desc:"逢凶化吉,贵人相助"},
  wenchang:{name:"文昌贵人",desc:"聪明好学,文采出众"},
  taohua:{name:"桃花",desc:"人缘魅力,风流多情"},
  yima:{name:"驿马",desc:"奔波走动,迁徙变动"},
  huagai:{name:"华盖",desc:"聪敏孤高,艺术宗教"},
  jiangxing:{name:"将星",desc:"权力领导,威严果决"},
  yuanchen:{name:"元辰",desc:"大耗,破财耗损"},
  kongwang:{name:"空亡",desc:"落空无成,虚无缥缈"}
};
// 天乙贵人: 甲戊庚牛羊,乙己鼠猴乡,丙丁猪鸡位,壬癸兔蛇藏,辛逢虎马
function tianyi(gan){ return tianyiGan(gan); }
function tianyiGan(gan){
  // 甲戊并牛羊(丑1未7) 乙己鼠猴乡(子0申8) 丙丁猪鸡位(亥11酉9) 壬癸蛇兔藏(巳5卯3) 庚辛逢虎马(寅2午6)
  const t={0:[1,7],4:[1,7],6:[1,7],1:[0,8],5:[0,8],2:[11,9],3:[11,9],8:[5,3],9:[5,3],7:[2,6]};
  return t[gan]||[];
}
function wenchangGan(gan){
  // 甲乙巳午报 丙戊申宫居 丁己酉鸡位 壬癸亥猪位 庚辛逢虎马
  const t={0:[5],1:[6],2:[8],3:[9],4:[8],5:[9],6:[2],7:[6],8:[10],9:[10]};
  // 标准: 甲见巳 乙见午 丙戊见申 丁己见酉 庚见亥 辛见子 壬见寅 癸见卯
  const s={0:[5],1:[6],2:[8],3:[9],4:[8],5:[9],6:[10],7:[0],8:[2],9:[3]};
  return s[gan]||[];
}
function taohuaZhi(zhi){
  // 寅午戌见卯 巳酉丑见午 申子辰见酉 亥卯未见子
  const y=zhi;
  if([2,6,10].includes(y)) return 3;
  if([5,9,1].includes(y)) return 6;
  if([8,0,4].includes(y)) return 9;
  if([11,3,7].includes(y)) return 0;
  return -1;
}
function yimaZhi(zhi){
  // 寅午戌见申 巳酉丑见亥 申子辰见寅 亥卯未见巳
  const y=zhi;
  if([2,6,10].includes(y)) return 8;
  if([5,9,1].includes(y)) return 11;
  if([8,0,4].includes(y)) return 2;
  if([11,3,7].includes(y)) return 5;
  return -1;
}
function huagaiZhi(zhi){
  // 寅午戌见戌 巳酉丑见丑 申子辰见辰 亥卯未见未
  const y=zhi;
  if([2,6,10].includes(y)) return 10;
  if([5,9,1].includes(y)) return 1;
  if([8,0,4].includes(y)) return 4;
  if([11,3,7].includes(y)) return 7;
  return -1;
}
function jiangxingZhi(zhi){
  if([2,6,10].includes(zhi)) return 6;
  if([5,9,1].includes(zhi)) return 9;
  if([8,0,4].includes(zhi)) return 0;
  if([11,3,7].includes(zhi)) return 3;
  return -1;
}
// 空亡: 以日柱所在旬论空亡
function kongwang(dayGZ){
  const idx=gzIndex(dayGZ[0],dayGZ[1]);
  const xunHead=Math.floor(idx/10)*10; // 旬首
  // 旬首到癸空亡两个地支
  const xunHeadZhi=xunHead%12;
  // 甲子旬空戌亥, 甲戌旬空申酉...
  const kong=[];
  kong[0]=(xunHeadZhi+10)%12;
  kong[1]=(xunHeadZhi+11)%12;
  return kong;
}

/* ======================== 胎元命宫身宫 ======================== */
function getTaiYuan(monthGZ){
  // 胎元: 月干进一位,月支进三位
  const g=(monthGZ[0]+1)%10;
  const z=(monthGZ[1]+3)%12;
  return [g,z];
}
function getMingGong(monthGZ,hourZhi){
  // 命宫: 卯上起正月逆数生月,顺数生时 → (3-(月支-寅2)+时支)%12 = (5-月支+时支)%12
  let mg=((5-monthGZ[1]+hourZhi)%12+12)%12;
  // 命宫天干用五虎遁(以年干)
  return mg;
}
function getShenGong(monthGZ,hourZhi){
  // 身宫: 寅上起正月顺数生月,顺数生时 → (2+(月支-寅2)+时支)%12 = (月支+时支)%12
  let sg=((monthGZ[1]+hourZhi)%12+12)%12;
  return sg;
}

/* ======================== 八字排盘主函数 ======================== */
const HOUR_NAMES=["子时(23-1)","丑时(1-3)","寅时(3-5)","卯时(5-7)","辰时(7-9)","巳时(9-11)","午时(11-13)","未时(13-15)","申时(15-17)","酉时(17-19)","戌时(19-21)","亥时(21-23)"];
function zhCompute(date,hourIdx,gender,place,options={}){
  if(![0,1].includes(gender)) throw new RangeError('请选择有效性别参数');
  const profile=getRuleProfile(options.schoolId===undefined?0:options.schoolId);
  const temporal=calculateBirth(date,hourIdx,place,{...options,dayBoundary:options.dayBoundary||profile.dayBoundary});
  date=temporal.effectiveDate; hourIdx=temporal.hourIdx;
  const lunar=solar2lunar(date);
  const {yearGZ,monthGZ,dayGZ,hourGZ}=temporal;
  const dg=dayGZ[0];
  const pillars=[yearGZ,monthGZ,dayGZ,hourGZ];
  const wxCount=countWuXing(pillars).counts;
  const wxStatistics=countWuXing(pillars,options.wxMode||profile.wxMode);
  const dy=getDaYun(temporal.civilDate,gender,yearGZ,1);
  // 十神统计(四柱天干+地支主气藏干)
  const tsCount=[0,0,0,0,0,0,0,0,0,0];
  [yearGZ,monthGZ,hourGZ].forEach(gz=>{tsCount[tenGod(dg,gz[0])]++;});
  [yearGZ[1],monthGZ[1],dayGZ[1],hourGZ[1]].forEach(z=>{tsCount[tenGod(dg,ZHI_HIDDEN[z][0])]++;});
  const mainTenGods=[...tsCount].map((c,i)=>({c,i})).sort((a,b)=>b.c-a.c).slice(0,2).filter(x=>x.c>0);
  const dayWX=GAN_WX[dg], shengMe=(dayWX+4)%5;
  const strength=computeStrength(pillars);
  const strengthScore=strength.score,strengthType=strength.type;
  const strong=strengthType==='身强'||strengthType==='身极强';
  const congGe=strengthType==='从弱';
  // 调候用神: 冬生(亥子丑月)用火暖局,夏生(巳午未月)用水润局
  const tiaoHouWX=([11,0,1].includes(monthGZ[1]))?1:([5,6,7].includes(monthGZ[1]))?4:-1; // 冬月(亥子丑)用火(1)暖局, 夏月(巳午未)用水(4)润局; 春秋-1无刚需 (v5.3修正: 夏月原误为0木, 应为4水)
  // v5.3 出生地调候修正(时地权重): 地域助长寒/燥→调候升格; 地域化解→调候降级转扶抑
  // 依据: 大唐咨询"时地权重"体系(北方水旺增寒湿·南方火旺增燥热·西方金旺秋燥冬寒·东方木旺春湿秋润·中原燥湿中庸)、《八字法天机》"须综合出生成长地分炎热寒湿地带"
  const placeFull=zhPlaceFull(place||'');
  const placeWx=placeFull?placeFull.wx:-1;
  const placeSub=placeFull?placeFull.sub:-1;
  let tiaoHouBoost=0, tiaoHouPlaceNote='';
  if(profile.geographicClimate&&placeWx>=0){
    const zim=[11,0,1].includes(monthGZ[1]), xia=[5,6,7].includes(monthGZ[1]);
    const pn=CITY_WX_DIR[placeWx];
    if(zim){
      if(placeWx===4){ tiaoHouBoost=1; tiaoHouPlaceNote='生于'+pn+'之地，冬寒加重，调候用火之需更急——寒炉添薪方得生机'; }
      else if(placeWx===3){ tiaoHouBoost=1; tiaoHouPlaceNote='生于'+pn+'之地，冬寒偏重，调候用火之需提升'; }
      else if(placeWx===1){ tiaoHouBoost=-1; tiaoHouPlaceNote='生于'+pn+'之地，地气生火缓冬寒，调候压力缓解，用神转重扶抑'; }
      else tiaoHouPlaceNote='生于'+pn+'之地，寒暖中平，调候照常';
    }else if(xia){
      if(placeWx===1){ tiaoHouBoost=1; tiaoHouPlaceNote='生于'+pn+'之地，燥热叠加，调候润局之需更急——旱田得雨方成气象'; }
      else if(placeWx===4){ tiaoHouBoost=-1; tiaoHouPlaceNote='生于'+pn+'之地，地气凉润，燥势大减，调候压力缓解，用神转重扶抑'; }
      else tiaoHouPlaceNote='生于'+pn+'之地，燥湿中平，调候照常';
    }else{
      const chun=[2,3,4].includes(monthGZ[1]), qiu=[8,9,10].includes(monthGZ[1]);
      if(placeWx===4) tiaoHouPlaceNote='生于'+pn+'之地，'+(chun?'春月湿寒偏重，可兼顾暖局之需':'秋月金寒偏重，可兼顾暖局之需');
      else if(placeWx===1) tiaoHouPlaceNote='生于'+pn+'之地，'+(chun?'春月燥热渐起，可兼顾润局之需':'秋月燥热偏重，可兼顾润局之需');
      else if(placeWx===3&&qiu) tiaoHouPlaceNote='生于'+pn+'之地，秋燥加重，可兼顾润局之需';
      else if(placeWx===0&&chun) tiaoHouPlaceNote='生于'+pn+'之地，春湿偏重，可兼顾暖局之需';
      else if(placeWx===2) tiaoHouPlaceNote='生于'+pn+'之地，燥湿中庸，调候之需不强';
      else tiaoHouPlaceNote='';
    }
  }
  // v5.6 次五行(九州分野·山川水系·矿藏气候)修正寒暖燥湿(按季节)
  if(profile.geographicClimate && tiaoHouPlaceNote && placeSub>=0 && placeSub!==placeWx){
    const zim=[11,0,1].includes(monthGZ[1]), xia=[5,6,7].includes(monthGZ[1]);
    let subNote;
    if(zim) subNote=placeSub===4?'寒湿倍增':placeSub===3?'金寒添凉':placeSub===1?'暖气稍济':placeSub===0?'湿寒加重':'土气中和';
    else if(xia) subNote=placeSub===4?'润气稍济':placeSub===3?'金凉减燥':placeSub===1?'燥热倍增':placeSub===0?'湿气蒸腾':'土气中和';
    else subNote=placeSub===4?'水气润泽':placeSub===3?'凉燥之气':placeSub===1?'燥热之气':placeSub===0?'木气生发':'土气中和';
    tiaoHouPlaceNote+='（兼'+WUXING[placeSub]+'气，'+subNote+'）';
  }
  // 用神: 身强取克泄耗(财官食伤)中最旺者,身弱取生我(印),从弱从所从,兼取调候
  let yongShen;
  if(strong){
    const cand=[(dayWX+2)%5,(dayWX+3)%5,(dayWX+1)%5]; // 财/官杀/食伤
    let best=cand[0];
    cand.forEach(c=>{ if(wxCount[c]>wxCount[best]) best=c; });
    yongShen=best;
  }else{
    yongShen=shengMe;
  }
  if(congGe){
    const opts=[
      {n:tsCount[4]+tsCount[5], w:(dayWX+2)%5},
      {n:tsCount[6]+tsCount[7], w:(dayWX+3)%5},
      {n:tsCount[2]+tsCount[3], w:(dayWX+1)%5}
    ];
    opts.sort((a,b)=>b.n-a.n);
    yongShen=opts[0].w;
  }
  const balancedYongShen=yongShen;
  // 调候优先: 冬夏生且调候五行可用时以调候为第一用神参考
  // 修复: 调候五行若恰为"克日主"(官杀=忌神阵营)则不覆盖,避免用神=忌神之矛盾(冬生金命用火调候却火克金)
  // v5.3 出生地权重修正调候优先级: 升格(boost>0, 地域助长寒燥)→调候有微根亦取; 降格(boost<0, 地域化解寒燥)→调候退出首选转扶抑, 唯原局寒燥成局(调候五行全缺且对冲五行≥3)仍取调候
  if(tiaoHouWX>=0 && tiaoHouWX!==(dayWX+3)%5){
    if(tiaoHouBoost>0 && wxCount[tiaoHouWX]<=1) yongShen=tiaoHouWX;
    else if(tiaoHouBoost<0){
      const heavy=tiaoHouWX===1?(wxCount[0]>=3&&wxCount[1]===0):(wxCount[1]>=3&&wxCount[0]===0);
      if(wxCount[tiaoHouWX]===0&&heavy) yongShen=tiaoHouWX;
    }else{
      if(wxCount[tiaoHouWX]===0) yongShen=tiaoHouWX;
    }
  }
  const useGod=selectProfileUseGod({balanced:balancedYongShen,climateElement:tiaoHouWX,climateCandidate:yongShen},null,profile);
  yongShen=useGod.element;
  // 财星信息
  const caiZheng=tsCount[5], caiPian=tsCount[4];
  let caiWei=[];
  [['年',yearGZ],['月',monthGZ],['日',dayGZ],['时',hourGZ]].forEach(([n,gz])=>{
    const tg=tenGod(dg,gz[0]);
    if(tg===4||tg===5) caiWei.push(n+'干');
    if(tenGod(dg,ZHI_HIDDEN[gz[1]][0])===4||tenGod(dg,ZHI_HIDDEN[gz[1]][0])===5) caiWei.push(n+'支');
  });
  const caiKu=[4,10,1,7].filter(z=>pillars.some(gz=>gz[1]===z));
  // 婚姻
  const fuQiGong=dayGZ[1];
  const hunXing=gender===1?[4,5]:[6,7]; // 男财女官
  const hunCount=tsCount[hunXing[0]]+tsCount[hunXing[1]];
  const fqTs=tenGod(dg,ZHI_HIDDEN[fuQiGong][0]);
  const taoHua=taohuaZhi(yearGZ[1]);
  // 紫微(标准: 命宫干支纳音定五行局; 年柱按农历正月初一)
  let mingGong=((2+lunar.month-1)%12+12)%12;
  mingGong=((mingGong-hourIdx)%12+12)%12;
  let shenGong=((2+lunar.month-1)%12+12)%12;
  shenGong=((shenGong+hourIdx)%12+12)%12;
  const lunarGZ=indexToGZ(((lunar.year-4)%60+60)%60);
  const mgGan=mingGongGan(lunarGZ[0],mingGong);
  const ju=getWuXingJuByMingGong(mgGan,mingGong);
  const zwPos=zwStarPos(ju,lunar.day);
  const stars=placeZWStars(zwPos);
  const mingStars=Object.keys(stars).filter(k=>stars[k]===mingGong);
  const siHua=SI_HUA[lunarGZ[0]]||SI_HUA[0];
  const daLim=getZWDaLim(mingGong,ju,gender,lunarGZ[0]);
  // 奇门(转盘时家: 值符/值使加临时干宫)
  const juInfo=qmGetJu(temporal.civilDate,1); // 综合排盘奇门佐证: 默认拆补法
  const hourIdx60q=gzIndex(hourGZ[0],hourGZ[1]);
  const xunHeadIdxq=Math.floor(hourIdx60q/10)*10;
  const xunHeadGZq=indexToGZ(xunHeadIdxq);
  const zfGong=zhiGongMap[xunHeadGZq[1]]||1;
  // 六爻(时间起卦)
  const sum=lunar.year%100+lunar.month+lunar.day;
  const upGua=sum%8,downGua=(sum+lunar.day)%8,dongYao=(sum+hourIdx)%6||6;
  const sixYao=[...[...BAGUA_BIN[downGua]].reverse(),...[...BAGUA_BIN[upGua]].reverse()];
  const changedSix=[...sixYao]; changedSix[dongYao-1]=1-changedSix[dongYao-1];
  const changeDown=BAGUA_BIN.findIndex(b=>JSON.stringify(b)===JSON.stringify(changedSix.slice(0,3).reverse()));
  const changeUp=BAGUA_BIN.findIndex(b=>JSON.stringify(b)===JSON.stringify(changedSix.slice(3,6).reverse()));
  return {date,hourIdx,gender,lunar,temporal,inputDate:temporal.inputDate,dayGan:dg,profile,ruleVersion:RULE_VERSION,school:profile.id,wxStatistics,strength,useGod,yearGZ,monthGZ,dayGZ,hourGZ,dg,pillars,wxCount,dy,
    tsCount,mainTenGods,strong,strengthScore,strengthType,congGe,yongShen,tiaoHouWX,
    place,placeWx,tiaoHouBoost,tiaoHouPlaceNote,
    caiZheng,caiPian,caiWei,caiKu,fuQiGong,hunCount,fqTs,taoHua,
    ju,mingGong,shenGong,mgGan,zwPos,stars,mingStars,siHua,daLim,
    juInfo,zfGong,upGua,downGua,dongYao,changeUp,changeDown,guaName:BAGUA[upGua]+BAGUA[downGua],changeName:BAGUA[changeUp]+BAGUA[changeDown]};
}

// Explicit state is authoritative. Boolean flags remain for binary scoring rules.
function classifyStrength(score){
  if(!Number.isFinite(score)) throw new RangeError('旺衰评分无效');
  const t=STRENGTH_RULES.thresholds;
  return score<=t.following?'从弱':score<t.weak?'身弱':score<t.balanced?'中和':score<t.strong?'身强':'身极强';
}
function strengthLabel(zh){ return zh.strengthType||classifyStrength(zh.strengthScore); }
function strengthAdvice(zh){
  return ({从弱:'顺势取用，避免机械生扶',身弱:'喜印比生扶',中和:'中和，须结合格局、调候与行运取用',身强:'喜克泄耗',身极强:'身极强，须结合是否从旺再论取用'})[strengthLabel(zh)];
}
function strengthText(zh,strongText,weakText,balancedText='日主中和，结合格局与行运判断',followingText='日主从弱，顺势取用'){
  const state=strengthLabel(zh);
  return state==='从弱'?followingText:state==='中和'?balancedText:state==='身弱'?weakText:strongText;
}
function calculateBirth(date,hourIdx,place='',options={}){
  assertSolarDate(date);
  if(!Number.isInteger(hourIdx)||hourIdx<0||hourIdx>11) throw new RangeError('请选择有效时辰');
  const dayBoundary=options.dayBoundary||'zi-chu';
  if(!['zi-chu','zi-zheng'].includes(dayBoundary)) throw new RangeError('未知换日规则');
  const inputDate=options.preciseTime?civilFromMillis(civilMillis(date)):withBirthTime(date,hourIdx,'',options.minute||0);
  const normalized=normalizeBirthTime(inputDate,options),civilDate=normalized.civilDate;
  const correction=options.trueSolar?trueSolarTime(civilDate,resolveLongitude(place)):null;
  const effectiveDate=correction?correction.date:civilFromMillis(civilMillis(civilDate));
  const dayDate=civilFromMillis(civilDay(effectiveDate)+(dayBoundary==='zi-chu'&&effectiveDate.getHours()>=23?86400000:0));
  const h=hourIndexAt(effectiveDate);
  const yearGZ=getYearGZ(civilDate),monthGZ=getMonthGZ(civilDate),dayGZ=getDayGZ(dayDate),hourGZ=getHourGZ(dayDate,h);
  return {...normalized,civilDate,effectiveDate,dayDate,hourIdx:h,yearGZ,monthGZ,dayGZ,hourGZ,dayBoundary,correction,preciseTime:!!options.preciseTime};
}
