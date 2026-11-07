const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');

test('same clock fields with distinct UTC offsets preserve both comprehensive charts',()=>{
  const engine=loadEngine({ui:true});
  engine.run(`for(const utcOffsetMinutes of [480,0,480]){
    const date=withBirthTime(parseCivilDate('2024-02-10'),5,'10:30');
    const chart=zhCompute(date,5,1,'',{preciseTime:true,utcOffsetMinutes});
    chart.time='10:30';
    saveRecord(chart,'样本');
  }`);
  const rows=engine.json("readStoredRecords(REC_KEY)");
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(row=>row.utcOffsetMinutes).sort((a,b)=>a-b),[0,480]);
});

test('candidate history keeps notes on replay and separates time conventions',()=>{
  const engine=loadEngine({ui:true});
  engine.run(`{
    const date=parseCivilDate('2024-02-10');
    const original=unknownBirthCandidates(date,'',{utcOffsetMinutes:480});
    saveUnknownRecord(original,'样本',1,0);
    const id=readStoredRecords(REC_KEY)[0].id;
    updateRecordNote(REC_KEY,id,'原备注');
    saveUnknownRecord(unknownBirthCandidates(date,'',{utcOffsetMinutes:0}),'样本',1,0);
    saveUnknownRecord(original,'样本',1,0);
  }`);
  const rows=engine.json("readStoredRecords(REC_KEY)");
  assert.equal(rows.length,2);
  assert.equal(rows.find(row=>row.utcOffsetMinutes===480).note,'原备注');
});

test('standalone birth history distinguishes exact minutes and Ziwei gender',()=>{
  const engine=loadEngine({ui:true});
  engine.run(`{
    const base={dateStr:'2024-02-10',hourIdx:5,gender:1};
    for(const time of ['10:15','10:45','10:15'])saveModRecord('bz',{...base,time});
    for(const gender of [1,0,1])saveModRecord('zw',{...base,gender});
  }`);
  assert.equal(engine.json("readStoredRecords('bz_records')").length,2);
  assert.equal(engine.json("readStoredRecords('zw_records')").length,2);
});

test('Ziwei history separates reference years and keeps a legacy current-year record identity',()=>{
  const engine=loadEngine({ui:true});
  engine.run(`{
    beijingNow=()=>parseCivilDate('2026-11-07');
    const base={dateStr:'2024-02-09',hourIdx:5,gender:1};
    saveModRecord('zw',base);
    const original=readStoredRecords('zw_records')[0];
    updateRecordNote('zw_records',original.id,'旧记录原备注');
    saveModRecord('zw',{...base,referenceYear:2025});
    saveModRecord('zw',{...base,referenceYear:2026});
  }`);
  const rows=engine.json("readStoredRecords('zw_records')");
  assert.equal(rows.length,2);
  assert.equal(rows.find(row=>row.referenceYear===2026).note,'旧记录原备注');
  assert.equal(rows.find(row=>row.referenceYear===2025).note,undefined);
});
