/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */
const QIMEN_RULE_VERSION='5.27.0';
const QM_RING=[1,8,3,4,9,2,7,6]; // 坎艮震巽离坤兑乾，顺时针
const QM_SOURCE='https://www.eee-learning.com/book/1345';
const QM_GONG=["坎","坤","震","巽","中","乾","兑","艮","离"];

const QM_GONG_NUM=[0,1,2,3,4,5,6,7,8,9];

const QM_YI=["戊","己","庚","辛","壬","癸","丁","丙","乙"];

const LUOSHU=[4,9,2,3,5,7,8,1,6];

const QM_JU_TABLE={
  // 阳遁(冬至23~芒种10)
  23:[1,7,4],  // 冬至
  0:[2,8,5],   // 小寒
  1:[3,9,6],   // 大寒
  2:[8,5,2],   // 立春
  3:[9,6,3],   // 雨水
  4:[1,7,4],   // 惊蛰
  5:[3,9,6],   // 春分
  6:[4,1,7],   // 清明
  7:[5,2,8],   // 谷雨
  8:[4,1,7],   // 立夏
  9:[5,2,8],   // 小满
  10:[6,3,9],  // 芒种
  // 阴遁(夏至11~大雪22)
  11:[9,3,6],  // 夏至
  12:[8,2,5],  // 小暑
  13:[7,1,4],  // 大暑
  14:[2,5,8],  // 立秋
  15:[1,4,7],  // 处暑
  16:[9,3,6],  // 白露
  17:[7,1,4],  // 秋分
  18:[6,9,3],  // 寒露
  19:[5,8,2],  // 霜降
  20:[6,9,3],  // 立冬
  21:[5,8,2],  // 小雪
  22:[4,7,1]   // 大雪
};

function qmGetYuan(date,termIdx){
  const day=getDayGZ(date),idx=gzIndex(day[0],day[1]),head=indexToGZ(idx-idx%5);
  return [0,2,1][head[1]%3]; // 符头支：子午卯酉上；寅申巳亥中；辰戌丑未下
}

function qmGetJu(date,school){
  // 定局: 节气(含节与气,各管三元) + 日干支定元
  // school: 0=置闰法(日干支三分近似), 1=拆补法(符头定元, 默认)
  const termIdx=getTermIndex(date);
  // 阳遁: 冬至(23)~芒种(10); 阴遁: 夏至(11)~大雪(22)
  const yang=termIdx>=23||termIdx<=10;
  const dayGZ=getDayGZ(date);
  const dayIdx=gzIndex(dayGZ[0],dayGZ[1]);
  let yuan;
  if(school===1){ yuan=qmGetYuan(date,termIdx); } // 拆补法: 符头定元
  else{ yuan=Math.floor(dayIdx/20); } // 置闰法近似: 日干支三分
  const j=QM_JU_TABLE[termIdx]||[1,7,4];
  const ju=j[yuan]||j[0];
  return {ju,yang,yuan,termIdx,dayGZ,dayIdx,fuTou:indexToGZ(dayIdx-dayIdx%5),method:school===1?'拆补法':'旧版日干支分段（近似）'};
}

const zhiGongMap={0:1,1:8,2:8,3:3,4:4,5:4,6:9,7:2,8:2,9:7,10:6,11:6};

function placeYi(ju,yang){
  const yiOrder=["戊","己","庚","辛","壬","癸","丁","丙","乙"];
  const pan={};
  for(let i=0;i<9;i++){
    let g=yang?(ju+i>9?ju+i-9:ju+i):(ju-i<1?ju-i+9:ju-i);
    pan[g]=yiOrder[i];
  }
  return pan;
}

const GONG_STAR={1:"天蓬",2:"天芮",3:"天冲",4:"天辅",5:"天禽",6:"天心",7:"天柱",8:"天任",9:"天英"};

const GONG_MEN={1:"休门",2:"死门",3:"伤门",4:"杜门",6:"开门",7:"惊门",8:"生门",9:"景门"};

const GONG_SHEN={1:"值符",2:"腾蛇",3:"太阴",4:"六合",6:"白虎",7:"玄武",8:"九地",9:"九天"};

function placeStarsTian(zfGong,hourGanGong){
  const pan={5:'天禽（寄天芮）'},from=QM_RING.indexOf(zfGong===5?2:zfGong),to=QM_RING.indexOf(hourGanGong===5?2:hourGanGong);
  QM_RING.forEach((g,i)=>{const origin=QM_RING[(i-to+from+8)%8];pan[g]=GONG_STAR[origin]+(origin===2?'／天禽':'');});
  return pan;
}

function placeMenZhuan(zfGong,hourGanGong){
  const order=QM_RING;
  const menSeq=order.map(g=>GONG_MEN[g]);
  const pan={};
  const zfIdx=order.indexOf(zfGong===5?2:zfGong);
  const hIdx=order.indexOf(hourGanGong===5?2:hourGanGong);
  order.forEach((g,i)=>{
    pan[g]=menSeq[((zfIdx-hIdx+i)%8+8)%8];
  });
  pan[5]="";
  return pan;
}

function placeShenZhuan(zfGong,hourGanGong,yang){
  const order=QM_RING;
  const shenSeq=['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
  const pan={};
  const hG=hourGanGong===5?2:hourGanGong;
  if(yang){
    const hIdx=order.indexOf(hG);
    order.forEach((g,i)=>{ pan[g]=shenSeq[((i-hIdx)%8+8)%8]; });
  }else{
    const revOrder=[...order].reverse();
    const revH=revOrder.indexOf(hG);
    revOrder.forEach((g,ri)=>{ pan[g]=shenSeq[((ri-revH)%8+8)%8]; });
  }
  return pan;
}

function calculateQimen({date,hourIdx=hourIndexAt(date),school=1,minute=date.getMinutes(),hourHH=date.getHours(),dayBoundary='zi-chu'}){
  assertSolarDate(date);
  if(!Number.isInteger(hourIdx)||hourIdx<0||hourIdx>11||![0,1].includes(school))throw new RangeError('奇门时辰或定局规则无效');
  const dayDate=moduleDayDate(date,dayBoundary),juInfo=qmGetJu(dayDate,school);
  // 节气按实际时刻，符头按所选换日；两者不可相互覆盖。
  juInfo.termIdx=getTermIndex(date);juInfo.yang=juInfo.termIdx>=23||juInfo.termIdx<=10;juInfo.ju=QM_JU_TABLE[juInfo.termIdx][juInfo.yuan];
  const hourGZ=getHourGZ(dayDate,hourIdx);
  const dayGZ=getDayGZ(dayDate);
  // 时辰旬首(六甲旬首)
  const hourIdx60=gzIndex(hourGZ[0],hourGZ[1]);
  const xunHeadIdx=Math.floor(hourIdx60/10)*10;
  const xunHeadGZ=indexToGZ(xunHeadIdx);
  const diPan=placeYi(juInfo.ju,juInfo.yang),xunYi=['戊','己','庚','辛','壬','癸'][Math.floor(hourIdx60/10)];
  const zfGong=Number(Object.keys(diPan).find(g=>diPan[g]===xunYi));
  const hourStem=hourGZ[0]===0?xunYi:GAN[hourGZ[0]],hourGanOriginalGong=Number(Object.keys(diPan).find(g=>diPan[g]===hourStem)),hourGanGong=hourGanOriginalGong===5?2:hourGanOriginalGong;
  const elapsed=hourIdx60%10,rawMenGong=((zfGong-1+(juInfo.yang?elapsed:-elapsed))%9+9)%9+1,zhiShiGong=rawMenGong===5?2:rawMenGong;
  const tianPan=placeStarsTian(zfGong,hourGanGong),baMen=placeMenZhuan(zfGong,zhiShiGong),baShen=placeShenZhuan(zfGong,hourGanGong,juInfo.yang),tianGan={},tianJiGan={};
  const from=QM_RING.indexOf(zfGong===5?2:zfGong),to=QM_RING.indexOf(hourGanGong);
  for(const [i,g] of QM_RING.entries()){const origin=QM_RING[(i-to+from+8)%8];tianGan[g]=diPan[origin];tianJiGan[g]=origin===2?diPan[5]:null;}
  const xunKongZhis=kongwang(hourGZ),xunKongGongs=[...new Set(xunKongZhis.map(z=>zhiGongMap[z]))],zfMen=GONG_MEN[zfGong===5?2:zfGong],zfStar=GONG_STAR[zfGong];
  const palaces=Array.from({length:9},(_,i)=>{const g=i+1;return {number:g,name:QM_GONG[i],earthlyStem:diPan[g],heavenlyStem:tianGan[g]||null,carriedStem:tianJiGan[g]||null,star:tianPan[g]||null,door:baMen[g]||null,spirit:baShen[g]||null,void:xunKongGongs.includes(g),zhiFu:g===hourGanGong,zhiShi:g===zhiShiGong};});
  return {rules:{version:QIMEN_RULE_VERSION,dayBoundary,clock:'UTC+08:00',rotation:'坎艮震巽离坤兑乾',center:'禽随芮；中五寄坤二',source:QM_SOURCE},date,hourIdx,minute,hourHH,juInfo,hourGZ,dayGZ,zfGong,xunHeadGZ,xunYi,hourGanGong,hourGanOriginalGong,zhiShiGong,rawMenGong,zfMen,zfStar,diPan,tianPan,baMen,baShen,tianGan,tianJiGan,xunKongZhis,xunKongGongs,palaces,school};
}
