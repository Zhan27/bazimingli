/* Versioned local record backups. No settings/API credentials are serialized. */
const REC_KEY='ml_records';
const MOD_REC_KEYS={zw:'zw_records',bz:'bz_records',qm:'qm_records',ly:'ly_records'};
const RECORD_KEYS=[REC_KEY,...Object.values(MOD_REC_KEYS)];
const BACKUP_MAX_BYTES=2*1024*1024;
function cleanRecord(record){
  if(!record||typeof record!=='object'||Array.isArray(record)) throw new Error('记录必须是对象');
  const r={};
  for(const [field,max] of Object.entries({id:80,key:500,name:100,note:1000,dateStr:10,bazi:500,pillars:500,lunarText:200,title:500,nums:100,place:200,time:5,dayBoundary:20,wxMode:40})){
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
  if(!['v4','v5','v6-selection'].includes(data.version)) throw new Error('不支持该备份版本（支持v4/v5/v6-selection）');
  const result={};
  RECORD_KEYS.forEach(k=>{if(Object.hasOwn(data,k)) result[k]=cleanRecordList(data[k]);});
  if(Object.hasOwn(data,'mingli_records')) result[REC_KEY]=mergeLegacyRecords(result[REC_KEY]||[],cleanRecordList(data.mingli_records));
  if(!Object.keys(result).length) throw new Error('备份文件中未找到排盘记录');
  return result;
}
function restoreRecordBackup(data,storage=localStorage){
  const records=parseRecordBackup(data), before={};
  if(data.version==='v6-selection')for(const key of Object.keys(records)){
    const existing=key===REC_KEY?mergeLegacyRecords(readStoredRecords(key,storage),readStoredRecords('mingli_records',storage)):readStoredRecords(key,storage);
    const ids=new Set(records[key].map(r=>r.id));records[key]=cleanRecordList([...records[key],...existing.filter(r=>!ids.has(r.id))]);
  }
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
/** Known categories only; the manager never enumerates browser/API settings. */
const RECORD_LABELS=Object.freeze({ml_records:'综合八字',bz_records:'八字页',zw_records:'紫微斗数',qm_records:'奇门遁甲',ly_records:'六爻'});
function listRecordEntries({query='',category='all',sort='updated-desc'}={},storage=localStorage){
  if(typeof query!=='string'||query.length>200||!['all',...RECORD_KEYS].includes(category)||!['updated-desc','updated-asc','date-desc','date-asc','name'].includes(sort))throw new TypeError('记录筛选条件无效');
  migrateLegacyRecords(storage);const q=query.toLowerCase();
  const rows=RECORD_KEYS.flatMap(key=>readStoredRecords(key,storage).map(record=>({key,record})));
  const selected=rows.filter(({key,record:r})=>(category==='all'||category===key)&&(!q||[r.name,r.dateStr,r.place,r.note,r.bazi,r.title,r.lunarText,RECORD_LABELS[key]].join(' ').toLowerCase().includes(q)));
  const direction=sort.endsWith('asc')?1:-1;
  return selected.sort((a,b)=>{
    let delta=sort==='name'?(a.record.name||'').localeCompare(b.record.name||'','zh-CN'):sort.startsWith('date')?a.record.dateStr.localeCompare(b.record.dateStr)*direction:((a.record.ts||0)-(b.record.ts||0))*direction;
    return delta||(a.key+'/'+a.record.id).localeCompare(b.key+'/'+b.record.id);
  });
}
function selectedRecordEntries(selection,storage){
  if(!Array.isArray(selection)||!selection.length||selection.length>250)throw new RangeError('请选择1至250条记录');
  const seen=new Set(),groups={};
  for(const item of selection){
    if(!item||!RECORD_KEYS.includes(item.key)||typeof item.id!=='string'||!/^[-\w]{1,80}$/.test(item.id))throw new TypeError('记录选择无效');
    const token=item.key+'/'+item.id;if(seen.has(token))throw new TypeError('存在重复选择');seen.add(token);
  }
  migrateLegacyRecords(storage);
  for(const item of selection){if(!groups[item.key])groups[item.key]=readStoredRecords(item.key,storage);if(!groups[item.key].some(r=>r.id===item.id))throw new RangeError('记录已变化，请刷新后重试');}
  return {groups,seen};
}
function createSelectedRecordBackup(selection,storage=localStorage){
  const {groups,seen}=selectedRecordEntries(selection,storage),out={version:'v6-selection',exported:new Date().toISOString()};
  for(const [key,rows] of Object.entries(groups))out[key]=rows.filter(r=>seen.has(key+'/'+r.id));return out;
}
function deleteRecordEntries(selection,storage=localStorage){
  const {groups,seen}=selectedRecordEntries(selection,storage),data={version:'v5'};
  for(const [key,rows] of Object.entries(groups))data[key]=rows.filter(r=>!seen.has(key+'/'+r.id));
  restoreRecordBackup(data,storage);return selection.length;
}
function updateRecordNote(key,id,note,storage=localStorage){
  if(typeof note!=='string'||note.length>1000)throw new TypeError('备注最多1000字');selectedRecordEntries([{key,id}],storage);
  const rows=readStoredRecords(key,storage).map(r=>r.id===id?{...r,note,ts:Date.now()}:r);restoreRecordBackup({version:'v5',[key]:rows},storage);
}
function clearAllRecordEntries(storage=localStorage){
  restoreRecordBackup({version:'v5',...Object.fromEntries(RECORD_KEYS.map(k=>[k,[]]))},storage);
}
