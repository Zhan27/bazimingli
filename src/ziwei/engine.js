/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */
const ZW_STARS={
  ziwei:{name:"紫微",type:"main"},
  tianji:{name:"天机",type:"main"},
  taiyang:{name:"太阳",type:"main"},
  wuqu:{name:"武曲",type:"main"},
  tiantong:{name:"天同",type:"main"},
  lianzhen:{name:"廉贞",type:"main"},
  tianfu:{name:"天府",type:"main"},
  taiyin:{name:"太阴",type:"main"},
  tanlang:{name:"贪狼",type:"main"},
  jumen:{name:"巨门",type:"main"},
  tianxiang:{name:"天相",type:"main"},
  tianliang:{name:"天梁",type:"main"},
  qisha:{name:"七杀",type:"main"},
  pojun:{name:"破军",type:"main"}
};

function mingGongGan(yearGan,mingZhi){
  const startGan=[2,4,6,8,0][yearGan%5]; // 甲己->丙(2),乙庚->戊(4)...
  return (startGan+(mingZhi-2+12)%12)%10;
}

const SI_HUA={
  0:['廉贞','破军','武曲','太阳'],1:['天机','天梁','紫微','太阴'],
  2:['天同','天机','文昌','廉贞'],3:['太阴','天同','天机','巨门'],
  4:['贪狼','太阴','右弼','天机'],5:['武曲','贪狼','天梁','文曲'],
  6:['太阳','武曲','太阴','天同'],7:['巨门','太阳','文曲','文昌'],
  8:['天梁','紫微','左辅','武曲'],9:['破军','巨门','太阴','贪狼']
};

function getWuXingJuByMingGong(mgGan,mgZhi){
  const ny=nayinIndex(mgGan,mgZhi);
  const lastChar=NAYIN[ny].charAt(NAYIN[ny].length-1);
  return {'金':4,'木':3,'水':2,'火':6,'土':5}[lastChar]||2;
}

function getZWDaLim(mingGong,ju,gender,yearGan){
  const yang=(yearGan%2===0); // 甲丙戊庚壬=阳
  const forward=(yang&&gender===1)||(!yang&&gender===0); // 阳男阴女顺
  const arr=[];
  for(let i=0;i<12;i++){
    const gz=(mingGong+(forward?i:-i)+12)%12;
    const s=ju+i*10;
    arr.push({zhi:gz,start:s,end:s+9,age:ju});
  }
  return {forward,list:arr,startAge:ju};
}

function zwStarPos(ju,day){
  let p=-1,j,u,D;
  do{ j=day+(++p); u=Math.floor(j/ju); D=j%ju; }while(D!==0);
  let I=(u%12)-1;
  if(p%2===0) I+=p; else I-=p;
  return ((2+I)%12+12)%12; // 寅=2 起算 → 地支索引(0=子)
}

function placeZWStars(zwPos){
  // 紫微星系: 逆布紫微天机(隔一),太阳武曲(隔二),天同(隔二),廉贞(隔三)
  // 紫微->天机->空->太阳->武曲->空->天同->空->空->廉贞
  const positions={};
  positions.ziwei=zwPos;
  positions.tianji=((zwPos-1)%12+12)%12;
  positions.taiyang=((zwPos-3)%12+12)%12;
  positions.wuqu=((zwPos-4)%12+12)%12;
  positions.tiantong=((zwPos-5)%12+12)%12;
  positions.lianzhen=((zwPos-8)%12+12)%12;
  // 天府星系: 天府=(4-紫微)mod12,顺布太阴贪狼巨门天相天梁七杀,隔二破军
  const tfPos=((4-zwPos)%12+12)%12;
  positions.tianfu=tfPos;
  positions.taiyin=((tfPos+1)%12);
  positions.tanlang=((tfPos+2)%12);
  positions.jumen=((tfPos+3)%12);
  positions.tianxiang=((tfPos+4)%12);
  positions.tianliang=((tfPos+5)%12);
  positions.qisha=((tfPos+6)%12);
  positions.pojun=((tfPos+10)%12);
  return positions;
}

function placeMinorStars(lunarMonth,hourIdx,yearGan){
  const positions={};
  positions.zuoqu=((4+lunarMonth-1)%12+12)%12;       // 辰(4)起顺数生月
  positions.youbi=((10-(lunarMonth-1))%12+12)%12;    // 戌(10)起逆数生月
  positions.wenchang=((4+hourIdx)%12+12)%12;         // 辰(4)起顺数生时
  positions.wenqu=((10-hourIdx)%12+12)%12;           // 戌(10)起逆数生时
  // 天魁天钺(年干): 甲0戊4庚6→丑1未7; 乙1己5→子0申8; 丙2丁3→亥11酉9; 壬8癸9→卯3巳5; 辛7→寅2午6(六辛逢虎马)
  const kuiYue={0:[1,7],4:[1,7],6:[1,7],1:[0,8],5:[0,8],2:[11,9],3:[11,9],8:[3,5],9:[3,5],7:[2,6]};
  const ky=kuiYue[yearGan]||[1,7];
  positions.tiankui=ky[0];
  positions.tianyue=ky[1];
  return positions;
}

function placeLuCun(yearGan){
  const map={0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0};
  return map[yearGan]!==undefined?map[yearGan]:2;
}

function placeQingYangTuoLuo(luCun){
  return {qingYang:(luCun+1)%12,tuoLuo:(luCun-1+12)%12};
}

function placeTianMa(yearZhi){
  const map={2:8,6:8,10:8,0:2,4:2,8:2,5:11,9:11,1:11,11:5,3:5,7:5};
  return map[yearZhi]!==undefined?map[yearZhi]:2;
}

function placeHuoLing(yearZhi,hourIdx){
  const huoMap={2:1,6:1,10:1,0:2,4:2,8:2,5:3,9:3,1:3,11:9,3:9,7:9}; // 火星起宫
  const lingMap={2:3,6:3,10:3,0:10,4:10,8:10,5:10,9:10,1:10,11:10,3:10,7:10}; // 铃星起宫
  return {
    huoXing:(huoMap[yearZhi]+hourIdx)%12,
    lingXing:(lingMap[yearZhi]+hourIdx)%12
  };
}

function placeKongJie(hourIdx){
  return {tianKong:(11-hourIdx+12)%12,diJie:(11+hourIdx)%12};
}

function placeJieKong(yearGan){
  const map={0:[8,9],5:[8,9],1:[6,7],6:[6,7],2:[4,5],7:[4,5],3:[2,3],8:[2,3],4:[0,1],9:[0,1]};
  const jk=map[yearGan]||[8,9];
  return {jieKong:jk[0],jieKong2:jk[1]}; // 正截空、副截空
}

function placeXunKong(yearGan,yearZhi){
  const idx=gzIndex(yearGan,yearZhi);
  const xunHead=Math.floor(idx/10)*10; // 旬首干支索引
  const headZhi=xunHead%12; // 旬首地支
  return {xunKong:(headZhi+11)%12,xunKong2:(headZhi+10)%12}; // 正旬空、副旬空
}

function placeTianShiTianShang(mingGong){
  return {tianShi:(mingGong-5+12)%12,tianShang:(mingGong-7+12)%12}; // 疾厄=命-5, 交友=命-7
}

function placeMingZhu(mingGong){
  const map={0:'贪狼',1:'巨门',11:'巨门',2:'禄存',10:'禄存',3:'文曲',9:'文曲',4:'廉贞',8:'廉贞',5:'武曲',7:'武曲',6:'破军'};
  return map[mingGong]||'贪狼';
}

function placeShenZhu(yearZhi){
  const map={0:'火星',6:'火星',1:'天相',7:'天相',2:'天梁',8:'天梁',3:'天同',9:'天同',4:'文昌',10:'文昌',5:'天机',11:'天机'};
  return map[yearZhi]||'天相';
}

function placeHongLuanTianXi(yearZhi){
  const hongLuan=(4-yearZhi+12)%12;
  return {hongLuan:hongLuan,tianXi:(hongLuan+6)%12};
}

function placeGuChenGuaSu(yearZhi){
  const gu={2:5,3:5,4:5,5:8,6:8,7:8,8:11,9:11,10:11,11:2,0:2,1:2};
  const gua={2:1,3:1,4:1,5:4,6:4,7:4,8:7,9:7,10:7,11:10,0:10,1:10};
  return {guChen:gu[yearZhi]||2,guaSu:gua[yearZhi]||10};
}

function placeLongChiFengGe(yearZhi){
  return {longChi:(4+yearZhi)%12,fengGe:(10-yearZhi+12)%12};
}

function placeTianKuTianXu(yearZhi){
  return {tianKu:(6-yearZhi+12)%12,tianXu:(6+yearZhi)%12};
}

function placeHuaGai(yearZhi){
  const map={0:4,4:4,8:4,1:1,5:1,9:1,2:10,6:10,10:10,3:7,7:7,11:7};
  return map[yearZhi]!==undefined?map[yearZhi]:4;
}

function placeXianChi(yearZhi){
  const map={0:9,4:9,8:9,1:6,5:6,9:6,2:3,6:3,10:3,3:0,7:0,11:0};
  return map[yearZhi]!==undefined?map[yearZhi]:9;
}

function placePoSui(yearZhi){
  if([0,6,3,9].includes(yearZhi)) return 5;
  if([2,8,5,11].includes(yearZhi)) return 9;
  return 1;
}

function placeFeiLian(yearZhi){
  const map={0:8,1:9,2:10,3:5,4:6,5:7,6:2,7:3,8:4,9:11,10:0,11:1};
  return map[yearZhi]!==undefined?map[yearZhi]:8;
}

function placeTianXingYao(lunarMonth){
  return {tianXing:(9+lunarMonth-1)%12,tianYao:(1+lunarMonth-1)%12};
}

function placeSanTaiBaZuo(lunarDay,zuoqu,youbi){
  return {sanTai:(zuoqu+lunarDay-1)%12,baZuo:((youbi-lunarDay+1)%12+12)%12};
}

function placeTaiFuFengGao(hourIdx){
  return {taiFu:(6+hourIdx)%12,fengGao:(2+hourIdx)%12};
}

function placeTianGuanTianFu(yearGan){
  const tg={0:7,1:4,2:5,3:2,4:3,5:9,6:11,7:9,8:10,9:6};
  const tf={0:9,1:8,2:0,3:11,4:3,5:2,6:6,7:5,8:6,9:5};
  return {tianGuan:tg[yearGan]||7,tianFu:tf[yearGan]||9};
}

function placeEnGuangTianGui(lunarDay,wenchang,wenqu){
  return {enGuang:(wenchang+lunarDay-2+12)%12,tianGui:(wenqu+lunarDay-2+12)%12};
}

function placeTianChu(yearGan){
  const map={0:5,3:5,1:6,4:6,7:6,2:0,5:8,6:2,8:9,9:11};
  return map[yearGan]!==undefined?map[yearGan]:5;
}

function placeSuiQian12(yearZhi){
  const names=['suiJian','huiQi','sangMen','guanSuo','guanFu','xiaoHao','daHao','longDe','baiHu','tianDe','diaoKe','bingFu'];
  const res={};
  names.forEach((n,i)=>{ res[n]=(yearZhi+i)%12; });
  return res;
}

function placeJiangQian12(yearZhi){
  const jiang={2:6,6:6,10:6,0:0,4:0,8:0,5:9,9:9,1:9,11:3,3:3,7:3}; // 年支→将星位
  const start=jiang[yearZhi]!==undefined?jiang[yearZhi]:0;
  const names=['jiangXing','panAn','suiYi','xiShen','huaGai2','jieSha','zaiSha','tianSha','zhiBei','xianChi2','yueSha','wangShen'];
  const res={};
  names.forEach((n,i)=>{ res[n]=(start+i)%12; });
  return res;
}

function placeBoShi12(mingGong,gender,yearGan){
  const yang=(yearGan%2===0);
  const forward=(yang&&gender===1)||(!yang&&gender===0); // 阳男阴女顺
  const names=['boShi','liShi','qingLong','xiaoHao2','jiangJun','zouShu','feiLian2','xiShen2','bingFu2','daHao2','fuBing','guanFu2'];
  const res={};
  names.forEach((n,i)=>{ res[n]=(mingGong+(forward?i:-i)+12)%12; });
  return res;
}

function placeChangSheng12(ju,gender,yearGan){
  const csStart={2:8,3:11,4:5,5:8,6:2}; // 局数→长生位
  const start=csStart[ju]!==undefined?csStart[ju]:8;
  const yang=(yearGan%2===0); // 甲丙戊庚壬=阳
  const forward=(yang&&gender===1)||(!yang&&gender===0); // 阳男阴女顺
  const names=["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];
  const arr=[];
  for(let i=0;i<12;i++){
    const zhi=(start+(forward?i:-i)+12)%12;
    arr.push({name:names[i],zhi});
  }
  return {forward,list:arr};
}

const ZW_BRIGHT={
  "紫微":["庙","庙","旺","旺","得","旺","庙","庙","旺","旺","得","旺"],
  "天机":["庙","陷","得","旺","利","平","庙","陷","得","旺","利","平"],
  "太阳":["陷","陷","旺","庙","旺","旺","旺","得","得","平","平","陷"],
  "武曲":["庙","庙","得","利","得","平","陷","庙","旺","庙","庙","平"],
  "天同":["旺","陷","利","平","平","陷","陷","陷","陷","平","平","旺"],
  "廉贞":["平","利","平","陷","利","庙","陷","利","平","平","平","庙"],
  "天府":["庙","庙","庙","庙","得","得","庙","庙","庙","庙","庙","庙"],
  "太阴":["庙","庙","平","陷","陷","陷","陷","陷","平","旺","庙","庙"],
  "贪狼":["旺","庙","平","旺","平","平","庙","庙","平","旺","庙","平"],
  "巨门":["旺","庙","庙","庙","平","陷","陷","陷","庙","旺","庙","庙"],
  "天相":["庙","庙","庙","庙","陷","庙","庙","庙","庙","庙","庙","庙"],
  "天梁":["庙","庙","庙","庙","庙","庙","庙","庙","庙","陷","庙","庙"],
  "七杀":["庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙"],
  "破军":["庙","陷","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙"],
  "文昌":["陷","平","庙","利","平","得","陷","平","庙","利","平","得"],
  "文曲":["陷","平","庙","利","平","得","陷","平","庙","利","平","得"],
  "左辅":["庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙"],
  "右弼":["庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙"],
  "禄存":["庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙"],
  "天马":["旺","旺","旺","旺","旺","旺","旺","旺","旺","旺","旺","旺"],
  "擎羊":["陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷"],
  "陀罗":["陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷"],
  "火星":["陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷"],
  "铃星":["陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷","陷"],
  "天魁":["庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙"],
  "天钺":["庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙","庙"]
};

function calculateZiwei({date,hourIdx,gender,referenceYear=beijingNow().getFullYear()}){
  assertSolarDate(date);
  if(!Number.isInteger(hourIdx)||hourIdx<0||hourIdx>11||![0,1].includes(gender))throw new RangeError('紫微时辰或性别参数无效');
  if(!Number.isInteger(referenceYear)||referenceYear<1901||referenceYear>2099)throw new RangeError('紫微流年参考年份须为1901至2099');
const lunar=solar2lunar(date);
  // 紫微斗数以农历排盘(年柱按农历正月初一,非八字立春)
  const lunarGZ=indexToGZ(((lunar.year-4)%60+60)%60);
  // 命宫: 从寅起正月顺数生月,逆数生时
  let mingGong=((2+lunar.month-1)%12+12)%12;
  mingGong=((mingGong-hourIdx)%12+12)%12;
  // 身宫: 从寅起正月顺数生月,顺数生时
  let shenGong=((2+lunar.month-1)%12+12)%12;
  shenGong=((shenGong+hourIdx)%12+12)%12;
  // 命宫天干(五虎遁定寅首) → 命宫干支纳音定五行局(安星诀标准,非年柱纳音)
  const mgGan=mingGongGan(lunarGZ[0],mingGong);
  const ju=getWuXingJuByMingGong(mgGan,mingGong);
  // 十二宫
  const palaces=["命宫","兄弟","夫妻","子女","财帛","疾厄","迁移","交友","官禄","田宅","福德","父母"];
  // 紫微星位
  const zwPos=zwStarPos(ju,lunar.day);
  // 安十四主星
  const stars=placeZWStars(zwPos);
  // 四化飞星(生年天干)
  const siHua=SI_HUA[lunarGZ[0]]||SI_HUA[0];
  // 辅星(标准安法): 左辅辰起顺数生月,右弼戌起逆数生月,文曲辰起顺数生时,文昌戌起逆数生时,天魁天钺按年干
  const minorStars=placeMinorStars(lunar.month,hourIdx,lunarGZ[0]);
  // 三合派完整小曜(依据《紫微斗数全书》) — 全部展平为独立字段
  const luCun=placeLuCun(lunarGZ[0]);
  const tianMa=placeTianMa(lunarGZ[1]);
  const hg=placeHuaGai(lunarGZ[1]);
  const xc=placeXianChi(lunarGZ[1]);
  const ps=placePoSui(lunarGZ[1]);
  const fl=placeFeiLian(lunarGZ[1]);
  const tc=placeTianChu(lunarGZ[0]);
  const mingZhuStar=placeMingZhu(mingGong);
  const shenZhuStar=placeShenZhu(lunarGZ[1]);
  const cs12=placeChangSheng12(ju,gender,lunarGZ[0]);
  const {qingYang,tuoLuo}=placeQingYangTuoLuo(luCun);
  const {huoXing,lingXing}=placeHuoLing(lunarGZ[1],hourIdx);
  const {tianKong,diJie}=placeKongJie(hourIdx);
  const {jieKong,jieKong2}=placeJieKong(lunarGZ[0]);
  const {xunKong,xunKong2}=placeXunKong(lunarGZ[0],lunarGZ[1]);
  const {tianShi,tianShang}=placeTianShiTianShang(mingGong);
  const {hongLuan,tianXi}=placeHongLuanTianXi(lunarGZ[1]);
  const {guChen,guaSu}=placeGuChenGuaSu(lunarGZ[1]);
  const {longChi,fengGe}=placeLongChiFengGe(lunarGZ[1]);
  const {tianKu,tianXu}=placeTianKuTianXu(lunarGZ[1]);
  const {tianXing,tianYao}=placeTianXingYao(lunar.month);
  const {sanTai,baZuo}=placeSanTaiBaZuo(lunar.day,minorStars.zuoqu,minorStars.youbi);
  const {taiFu,fengGao}=placeTaiFuFengGao(hourIdx);
  const {tianGuan,tianFu}=placeTianGuanTianFu(lunarGZ[0]);
  const {enGuang,tianGui}=placeEnGuangTianGui(lunar.day,minorStars.wenchang,minorStars.wenqu);
  // 岁前十二神(年支起顺行): 岁建晦气丧门贯索官符小耗大耗龙德白虎天德吊客病符
  const suiQian=placeSuiQian12(lunarGZ[1]);
  // 将前十二神(将星起顺行): 将星攀鞍岁驿息神华盖劫煞灾煞天煞指背咸池月煞亡神
  const jiangQian=placeJiangQian12(lunarGZ[1]);
  // 博士十二神(命宫起,顺逆同大限): 博士力士青龙小耗将军奏书飞廉喜神病符大耗伏兵官府
  const boShi=placeBoShi12(mingGong,gender,lunarGZ[0]);
  // 流年四化(当前流年天干)
  const nowYr=referenceYear;
  const curLunar=solar2lunar(parseCivilDate(nowYr+'-01-01'));
  const curGZ=indexToGZ(((curLunar.year-4)%60+60)%60);
  const liuNianSiHua=SI_HUA[curGZ[0]]||SI_HUA[0];
  // 大限起运
  const daLim=getZWDaLim(mingGong,ju,gender,lunarGZ[0]);
  // 各宫天干(五虎遁定寅首)
  const gongGan={};
  for(let i=0;i<12;i++){ gongGan[i]=mingGongGan(lunarGZ[0],i); }
  return {lunar,yearGZ:lunarGZ,ju,mingGong,shenGong,mgGan,stars,minorStars,siHua,liuNianSiHua,
    luCun,tianMa,hg,xc,ps,fl,tc,mingZhuStar,shenZhuStar,cs12,
    qingYang,tuoLuo,huoXing,lingXing,tianKong,diJie,jieKong,jieKong2,xunKong,xunKong2,
    tianShi,tianShang,hongLuan,tianXi,guChen,guaSu,longChi,fengGe,tianKu,tianXu,
    tianXing,tianYao,sanTai,baZuo,taiFu,fengGao,tianGuan,tianFu,enGuang,tianGui,
    ...suiQian,...jiangQian,...boShi,
    palaces,gender,hourIdx,daLim,gongGan};
}
