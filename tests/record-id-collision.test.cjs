const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');

function sameClockAndRandom(engine,code){
  engine.run(`{
    const originalNow=Date.now,originalRandom=Math.random;
    try{
      Date.now=()=>1707525240000;
      Math.random=()=>0.5;
      ${code}
    }finally{Date.now=originalNow;Math.random=originalRandom;}
  }`);
}
function twoDistinctRows(engine,key){
  const rows=engine.json(`readStoredRecords('${key}')`);
  assert.equal(rows.length,2);
  assert.equal(new Set(rows.map(r=>r.id)).size,2);
}

test('comprehensive records remain readable when two saves have the same clock and random value',()=>{
  const e=loadEngine({ui:true});
  e.run("var chart=zhCompute(withBirthTime(parseCivilDate('2024-02-10'),6,'12:00'),6,1,'');");
  sameClockAndRandom(e,"saveRecord(chart,'甲');saveRecord(chart,'乙');");
  twoDistinctRows(e,'ml_records');
});

test('unknown-time records cannot collide under repeated entropy',()=>{
  const e=loadEngine({ui:true});
  e.run("var candidate=unknownBirthCandidates(parseCivilDate('2024-02-10'),'');");
  sameClockAndRandom(e,"saveUnknownRecord(candidate,'甲',1,0);saveUnknownRecord(candidate,'乙',1,0);");
  twoDistinctRows(e,'ml_records');
});

test('standalone records retain distinct inputs when record ID entropy repeats',()=>{
  for(const module of ['bz','zw','qm','ly']){
    const e=loadEngine({ui:true});
    sameClockAndRandom(e,`for(const gender of [0,1])saveModRecord('${module}',{dateStr:'2024-02-10',hourIdx:6,gender,mode:1,nums:'3 8 '+(gender+1),hourHH:12,minute:gender});`);
    twoDistinctRows(e,module+'_records');
  }
});

test('paired records retain both pairs when record ID entropy repeats',()=>{
  const e=loadEngine({ui:true});
  sameClockAndRandom(e,`{
    const left={name:'甲',date:'2024-02-10',time:'12:00',gender:1};
    for(const name of ['乙','丙'])savePairRecord(left,{...left,name,gender:0},2026);
  }`);
  twoDistinctRows(e,'hh_records');
});
