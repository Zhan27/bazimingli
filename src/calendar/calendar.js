/* Calendar adapter. Civil fields always mean UTC+08:00 standard time, without
 * historic DST. Date is a civil-field container, not the browser's time zone.
 * lunar-javascript 1.7.7 supplies lunar dates and second-resolution solar terms.
 * See tests/fixtures/SOURCES.md for accuracy limits and independent references. */
const CALENDAR_MIN='1900-01-31', CALENDAR_MAX='2099-12-31';
// Store civil fields on a UTC axis. A browser in a DST zone must not normalize
// a Beijing input such as 2024-03-10 02:30 to 03:30 in America/New_York.
class CivilDate extends Date {
  getFullYear(){return this.getUTCFullYear();}
  getMonth(){return this.getUTCMonth();}
  getDate(){return this.getUTCDate();}
  getDay(){return this.getUTCDay();}
  getHours(){return this.getUTCHours();}
  getMinutes(){return this.getUTCMinutes();}
  getSeconds(){return this.getUTCSeconds();}
  getMilliseconds(){return this.getUTCMilliseconds();}
  setFullYear(...args){return this.setUTCFullYear(...args);}
  setMonth(...args){return this.setUTCMonth(...args);}
  setDate(...args){return this.setUTCDate(...args);}
  setHours(...args){return this.setUTCHours(...args);}
  setMinutes(...args){return this.setUTCMinutes(...args);}
}
const TERM_NAMES=['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
const JIE_NAMES=TERM_NAMES.filter((_,i)=>i%2===0);
function civilMillis(d){
  if(!(d instanceof Date)||!Number.isFinite(d.getTime())) throw new RangeError('请输入有效日期');
  return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
}
function civilFromMillis(ms){
  return new CivilDate(ms);
}
function beijingNow(){return civilFromMillis(Date.now()+8*3600000);}
function civilDay(d){ return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()); }
function assertSolarDate(d){
  civilMillis(d);
  if(civilDay(d)<Date.UTC(1900,0,31)||civilDay(d)>Date.UTC(2099,11,31))
    throw new RangeError('支持的公历范围为 '+CALENDAR_MIN+' 至 '+CALENDAR_MAX+'，请核对出生日期');
  return d;
}
function parseCivilDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) throw new RangeError('请选择有效出生日期');
  const [y,m,d]=value.split('-').map(Number), date=civilFromMillis(Date.UTC(y,m-1,d));
  if(date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d) throw new RangeError('日期不存在');
  return assertSolarDate(date);
}
function librarySolar(d){ return Solar.fromYmdHms(d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()); }
function assertLunarYear(y){ if(!Number.isInteger(y)||y<1900||y>2099) throw new RangeError('农历年份须为1900至2099'); }
function lunarYearDays(y){ assertLunarYear(y); return LunarYear.fromYear(y).getDayCount(); }
function leapMonth(y){ assertLunarYear(y); return LunarYear.fromYear(y).getLeapMonth(); }
function monthDays(y,m){ assertLunarYear(y); if(!Number.isInteger(m)||m<1||m>12) throw new RangeError('农历月份须为1至12'); return LunarMonth.fromYm(y,m).getDayCount(); }
function leapDays(y){ const m=leapMonth(y); return m?LunarMonth.fromYm(y,-m).getDayCount():0; }
function solar2lunar(date){
  assertSolarDate(date);
  const l=librarySolar(date).getLunar();
  return {year:l.getYear(),month:Math.abs(l.getMonth()),day:l.getDay(),isLeap:l.getMonth()<0};
}
function lunar2solar(year,month,day,isLeap=false){
  assertLunarYear(year);
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||typeof isLeap!=='boolean') throw new RangeError('农历月日或闰月参数无效');
  if(isLeap&&leapMonth(year)!==month) throw new RangeError('所选农历年份不存在该闰月');
  const days=isLeap?leapDays(year):monthDays(year,month);
  if(day<1||day>days) throw new RangeError('所选农历月份没有该日期');
  const s=Lunar.fromYmd(year,isLeap?-month:month,day).getSolar();
  return assertSolarDate(civilFromMillis(Date.UTC(s.getYear(),s.getMonth()-1,s.getDay())));
}
const termCache=new Map();
function solarTerms(year){
  // Adjacent years are needed to bracket the first/last supported dates.
  if(!Number.isInteger(year)||year<1899||year>2100) throw new RangeError('节气年份超出支持范围');
  if(!termCache.has(year)){
    const table=Solar.fromYmd(year,7,1).getLunar().getJieQiTable();
    const times=TERM_NAMES.map(name=>{
      const s=table[name==='冬至'?'DONG_ZHI':name];
      if(s.getYear()!==year) throw new Error('节气年份不一致：'+name);
      return Date.UTC(s.getYear(),s.getMonth()-1,s.getDay(),s.getHour(),s.getMinute(),s.getSecond());
    });
    termCache.set(year,times);
  }
  return termCache.get(year);
}
function solarTermMoment(year,idx){
  if(!Number.isInteger(idx)||idx<0||idx>23) throw new RangeError('节气索引须为0至23');
  return civilFromMillis(solarTerms(year)[idx]);
}
function solarTermDay(year,idx){ return solarTermMoment(year,idx).getDate(); }
function getTermIndex(date){
  const t=civilMillis(date), times=solarTerms(date.getFullYear());
  for(let i=23;i>=0;i--) if(t>=times[i]) return i;
  return 23;
}
function getMonthZhi(termIdx){ return (Math.floor(termIdx/2)+1)%12; }

// NOAA fractional-year approximation, minutes. Not an ephemeris-grade result.
function equationOfTime(date){
  const y=date.getFullYear(), days=(Date.UTC(y+1,0,1)-Date.UTC(y,0,1))/86400000;
  const doy=(civilDay(date)-Date.UTC(y,0,1))/86400000+1;
  const h=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
  const g=2*Math.PI/days*(doy-1+(h-12)/24);
  return 229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
}
function trueSolarTime(date,longitude){
  if(!Number.isFinite(longitude)||Math.abs(longitude)>180) throw new RangeError('经度无效');
  const longitudeMin=(longitude-120)*4, equationMin=equationOfTime(date);
  const offsetMin=longitudeMin+equationMin;
  const correctedDate=civilFromMillis(civilMillis(date)+Math.round(offsetMin*60000));
  assertSolarDate(correctedDate);
  return {longitude,longitudeMin,equationMin,offsetMin,date:correctedDate,dayOffset:Math.round((civilDay(correctedDate)-civilDay(date))/86400000),trueTime:{h:correctedDate.getHours(),m:correctedDate.getMinutes()}};
}
function hourIndexAt(date){ return Math.floor((date.getHours()+1)/2)%12; }
function moduleDayDate(date,dayBoundary='zi-chu'){
  if(!['zi-chu','zi-zheng'].includes(dayBoundary))throw new RangeError('未知换日规则');
  return civilFromMillis(civilDay(date)+(dayBoundary==='zi-chu'&&date.getHours()>=23?86400000:0));
}
function withBirthTime(date,hourIdx,timeText,minute=0){
  assertSolarDate(date);
  if(!Number.isInteger(hourIdx)||hourIdx<0||hourIdx>11) throw new RangeError('请选择有效时辰');
  let h=hourIdx*2, m=minute;
  if(timeText){
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeText)) throw new RangeError('出生时间须为00:00至23:59');
    [h,m]=timeText.split(':').map(Number);
  }
  if(!Number.isInteger(m)||m<0||m>59) throw new RangeError('分钟须为0至59');
  return civilFromMillis(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate(),h,m));
}
function normalizeBirthTime(inputDate,options={}){
  const utcOffsetMinutes=options.utcOffsetMinutes===undefined?480:Number(options.utcOffsetMinutes);
  const dstMinutes=options.dstMinutes===undefined?0:Number(options.dstMinutes);
  if(!Number.isInteger(utcOffsetMinutes)||utcOffsetMinutes < -720||utcOffsetMinutes>840)throw new RangeError('UTC标准时偏移须在-12:00至+14:00之间');
  if(![0,60].includes(dstMinutes))throw new RangeError('夏令时修正须为0或60分钟');
  const instantMs=civilMillis(inputDate)-(utcOffsetMinutes+dstMinutes)*60000;
  const civilDate=civilFromMillis(instantMs+480*60000);
  assertSolarDate(civilDate);
  return {inputDate:civilFromMillis(civilMillis(inputDate)),utcOffsetMinutes,dstMinutes,instantMs,instantUtc:new Date(instantMs).toISOString(),civilDate};
}
function utcOffsetLabel(minutes){
  const sign=minutes<0?'-':'+';const value=Math.abs(minutes);
  return 'UTC'+sign+String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
}
