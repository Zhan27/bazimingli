/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */
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
  const y=date.getFullYear(),m=date.getMonth(),d=date.getDate();
  const termYear=termIdx===23&&date.getMonth()===0?y-1:y;
  const termDay=solarTermDay(termYear,termIdx);
  const termDate=civilFromMillis(Date.UTC(termYear,Math.floor(termIdx/2),termDay));
  const diff=Math.round((civilDay(date)-civilDay(termDate))/86400000);
  const tGZ=getDayGZ(termDate);
  const tIdx=gzIndex(tGZ[0],tGZ[1]);
  // 节气后第一个甲(0)/己(5)日(符头)距节天数: 0-9
  let fuTou=0;
  for(let i=0;i<10;i++){ const g=(tIdx+i)%10; if(g===0||g===5){ fuTou=i; break; } }
  const daysSinceFu=diff-fuTou;
  const yuan=((Math.floor(daysSinceFu/5)%3)+3)%3; // 0上元 1中元 2下元
  return yuan;
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
  return {ju,yang,yuan,termIdx,dayGZ,dayIdx};
}

const zhiGongMap={0:1,1:8,2:8,3:3,4:4,5:9,6:9,7:2,8:2,9:7,10:6,11:1};

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
  const starSeq=[1,2,3,4,5,6,7,8,9].map(g=>GONG_STAR[g]);
  const pan={};
  const offset=(((zfGong-1)-(hourGanGong-1))%9+9)%9;
  for(let g=1;g<=9;g++){ pan[g]=starSeq[((g-1+offset)%9+9)%9]; }
  return pan;
}

function placeMenZhuan(zfGong,hourGanGong){
  const order=[1,2,3,4,6,7,8,9];
  const menSeq=order.map(g=>GONG_MEN[g]);
  const pan={};
  const zfIdx=order.indexOf(zfGong);
  const hIdx=order.indexOf(hourGanGong===5?2:hourGanGong);
  order.forEach((g,i)=>{
    pan[g]=menSeq[((zfIdx-hIdx+i)%8+8)%8];
  });
  pan[5]="";
  return pan;
}

function placeShenZhuan(zfGong,hourGanGong,yang){
  const order=[1,2,3,4,6,7,8,9];
  const shenSeq=order.map(g=>GONG_SHEN[g]); // [值符,腾蛇,太阴,六合,白虎,玄武,九地,九天]
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

function calculateQimen({date,hourIdx=hourIndexAt(date),school=1,minute=date.getMinutes(),hourHH=date.getHours()}){
  assertSolarDate(date);
  if(!Number.isInteger(hourIdx)||hourIdx<0||hourIdx>11||![0,1].includes(school))throw new RangeError('奇门时辰或定局规则无效');
const juInfo=qmGetJu(date,school);
  const hourGZ=getHourGZ(date,hourIdx);
  const dayGZ=getDayGZ(date);
  // 时辰旬首(六甲旬首)
  const hourIdx60=gzIndex(hourGZ[0],hourGZ[1]);
  const xunHeadIdx=Math.floor(hourIdx60/10)*10;
  const xunHeadGZ=indexToGZ(xunHeadIdx);
  // 值符落宫 = 旬首地支所在宫
  const zfGong=zhiGongMap[xunHeadGZ[1]]||1;
  // 排盘
  return {date,hourIdx,minute,hourHH,juInfo,hourGZ,dayGZ,zfGong,xunHeadGZ,school};
}
