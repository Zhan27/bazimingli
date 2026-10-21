/* Versioned local record backups. No settings/API credentials are serialized. */
const REC_KEY='ml_records';
const MOD_REC_KEYS={zw:'zw_records',bz:'bz_records',qm:'qm_records',ly:'ly_records'};
const RECORD_KEYS=[REC_KEY,...Object.values(MOD_REC_KEYS)];
const BACKUP_MAX_BYTES=2*1024*1024;
function cleanRecord(record){
  if(!record||typeof record!=='object'||Array.isArray(record)) throw new Error('记录必须是对象');
  const r={};
  for(const [field,max] of Object.entries({id:80,key:500,name:100,dateStr:10,bazi:500,pillars:500,lunarText:200,title:500,nums:100,place:200,time:5,dayBoundary:20,wxMode:40})){
    if(record[field]===undefined) continue;
    let value=record[field];
    if(field==='id'&&Number.isSafeInteger(value)) value=String(value);
    if(typeof value!=='string'||value.length>max) throw new Error('记录字段无效：'+field);
    r[field]=value;
  }
  if(!r.id||!/^[-\w]{1,80}$/.test(r.id)) throw new Error('记录ID无效');
  if(!r.dateStr) throw new Error('记录缺少日期');
  parseCivilDate(r.dateStr);
  for(const [field,min,max] of [['utcOffsetMinutes',-720,840],['dstMinutes',0,60],['hourIdx',0,11],['gender',0,1],['school',0,2],['school2',0,4],['style',0,1],['mode',0,2],['minute',0,59],['hourHH',0,23],['ts',0,Number.MAX_SAFE_INTEGER]]){
    if(record[field]===undefined) continue;
    if(!Number.isInteger(record[field])||record[field]<min||record[field]>max) throw new Error('记录字段无效：'+field);
    r[field]=record[field];
  }
  if(r.hourIdx===undefined) throw new Error('记录缺少时辰');
  for(const field of ['trueSun','unknowHour','genderUnspecified']){
    if(record[field]!==undefined){ if(typeof record[field]!=='boolean') throw new Error('记录字段无效：'+field); r[field]=record[field]; }
  }
  if(r.dstMinutes!==undefined&&![0,60].includes(r.dstMinutes))throw new Error('夏令时参数无效');
  if(r.wxMode&&!WX_MODES[r.wxMode])throw new Error('五行统计口径无效');
  if(r.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) throw new Error('记录时间无效');
  if(r.dayBoundary&&!['zi-chu','zi-zheng'].includes(r.dayBoundary)) throw new Error('记录换日规则无效');
  return r;
}
function cleanRecordList(list){
  if(!Array.isArray(list)||list.length>50) throw new Error('每类记录须为数组且最多50条');
  const records=list.map(cleanRecord), ids=new Set();
  records.forEach(r=>{if(ids.has(r.id)) throw new Error('存在重复记录ID');ids.add(r.id);});
  return records;
}
function mergeLegacyRecords(current,legacy){
  const merged=[...current],ids=new Set(current.map(r=>r.id));
  legacy.forEach(r=>{if(!ids.has(r.id)){merged.push(r);ids.add(r.id);}});
  if(merged.length>50) throw new Error('新旧主记录合计超过50条，请分别备份后整理');
  return merged;
}
function readStoredRecords(key,storage=localStorage){
  const raw=storage.getItem(key);
  return raw?cleanRecordList(JSON.parse(raw)):[];
}
function migrateLegacyRecords(storage=localStorage){
  if(!storage.getItem('mingli_records')) return;
  const merged=mergeLegacyRecords(readStoredRecords(REC_KEY,storage),readStoredRecords('mingli_records',storage));
  storage.setItem(REC_KEY,JSON.stringify(merged));
  storage.removeItem('mingli_records');
}
function createRecordBackup(storage=localStorage){
  migrateLegacyRecords(storage);
  const data={version:'v5',exported:new Date().toISOString()};
  RECORD_KEYS.forEach(k=>{ data[k]=readStoredRecords(k,storage); });
  return data;
}
function parseRecordBackup(data){
  if(!data||typeof data!=='object'||Array.isArray(data)) throw new Error('备份必须是JSON对象');
  if(!['v4','v5'].includes(data.version)) throw new Error('不支持该备份版本（支持v4/v5）');
  const result={};
  RECORD_KEYS.forEach(k=>{if(Object.hasOwn(data,k)) result[k]=cleanRecordList(data[k]);});
  if(Object.hasOwn(data,'mingli_records')) result[REC_KEY]=mergeLegacyRecords(result[REC_KEY]||[],cleanRecordList(data.mingli_records));
  if(!Object.keys(result).length) throw new Error('备份文件中未找到排盘记录');
  return result;
}
function restoreRecordBackup(data,storage=localStorage){
  const records=parseRecordBackup(data), before={};
  Object.keys(records).forEach(k=>{before[k]=storage.getItem(k);});
  // Remove the migrated legacy key so clear/reload cannot resurrect old records.
  before.mingli_records=storage.getItem('mingli_records');
  try{
    Object.entries(records).forEach(([k,v])=>storage.setItem(k,JSON.stringify(v)));
    if(Object.hasOwn(records,REC_KEY)) storage.removeItem('mingli_records');
  }catch(e){
    for(const [k,v] of Object.entries(before)){
      try{if(v===null) storage.removeItem(k);else storage.setItem(k,v);}catch(rollbackError){throw new Error('存储失败且回滚失败，请保留原备份文件');}
    }
    throw new Error('存储空间不足或不可用，导入未完成，已还原原记录');
  }
  return Object.keys(records).length;
}
