/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */
function lunarMonthName(m,leap){ return (leap?"闰":"")+"正二三四五六七八九十冬腊"[m-1]+"月"; }

function lunarDayName(d){
  const n=["初一","初二","初三","初四","初五","初六","初七","初八","初九","初十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十","廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];
  return n[d-1]||String(d);
}

function fmtLocalDate(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function nowLiuNian(zh,date=beijingNow()){
  const [g,z]=getYearGZ(date),tg=tenGod(zh.dg,g);
  return {year:date.getFullYear(),g,z,tg,name:SHISHEN_NAME[tg]};
}

const CHANGSHENG=["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];

const CS_START={0:11,1:6,2:2,3:9,4:2,5:9,6:5,7:0,8:8,9:3};

function getChangSheng(dayGan,zhi){
  const start=CS_START[dayGan];
  let offset=(zhi-start+12)%12;
  if(GAN_YIN[dayGan]===0) offset=(12-offset)%12; // 阴干逆行
  return CHANGSHENG[offset];
}

function getMingGua(year,gender){
  const y=year%100;
  let n=gender===1?(100-y):(y-4);
  n=((n%9)+9)%9; if(n===0)n=9;
  if(n===5) return gender===1?'坤卦(中宫)':'艮卦(中宫)';
  return {1:'坎卦',2:'坤卦',3:'震卦',4:'巽卦',6:'乾卦',7:'兑卦',8:'艮卦',9:'离卦'}[n];
}

function esc0(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
