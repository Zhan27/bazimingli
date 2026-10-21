const fs=require('node:fs');
const path=require('node:path');
const {loadEngine,root}=require('../tests/helpers.cjs');
function chartFacts(z,e){
  return {pillars:z.pillars,lunar:z.lunar,term:e.context.getTermIndex(z.temporal.civilDate),dayun:{startAge:z.dy.startAge,startYears:z.dy.startYears,startMonths:z.dy.startMonths,forward:z.dy.forward,days:z.dy.days,list:z.dy.dyList.map(x=>[x.g,x.z,x.age])},wxCount:z.wxCount,strengthScore:Number(z.strengthScore.toFixed(8)),strengthType:z.strengthType,yongShen:z.yongShen};
}
function differences(expected,actual,prefix=''){
  if(typeof expected==='number'&&typeof actual==='number')return Math.abs(expected-actual)<1e-8?[]:[prefix];
  if(expected===null||typeof expected!=='object')return expected===actual?[]:[prefix];
  if(actual===null||typeof actual!=='object')return [prefix];
  const keys=new Set([...Object.keys(expected),...Object.keys(actual)]);
  return [...keys].flatMap(k=>differences(expected[k],actual[k],prefix?prefix+'.'+k:k));
}
function runRegression(write=true){
  const fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/charts-v5.16.json'),'utf8'));
  const e=loadEngine({ui:true});
  const cases=fixture.cases.map(row=>{
    e.context.input=row.input;
    try{
      const z=e.run(`(()=>{const d=withBirthTime(parseCivilDate(input.date),0,input.time);return zhCompute(d,hourIndexAt(d),input.gender,input.place,input.options);})()`);
      const actual=JSON.parse(JSON.stringify(chartFacts(z,e))),mismatches=differences(row.expected,actual);
      return {id:row.id,input:row.input,ruleVersion:e.run('RULE_VERSION'),reference:fixture.source,expected:row.expected,actual,status:mismatches.length?'fail':'pass',mismatches};
    }catch(err){return {id:row.id,input:row.input,status:'fail',error:err.message};}
  });
  const result={version:e.run('RULE_VERSION'),baseline:fixture.version,scope:'All frozen chart cases, including four pillars, lunar date, solar term, DaYun, wuxing, strength and use-god. New rules additionally covered by calculation-rules and browser tests.',total:cases.length,passed:cases.filter(c=>c.status==='pass').length,failed:cases.filter(c=>c.status!=='pass').length,cases};
  if(write){fs.mkdirSync(path.join(root,'verification'),{recursive:true});fs.writeFileSync(path.join(root,'verification/regression.json'),JSON.stringify(result,null,2)+'\n');}
  return result;
}
if(require.main===module){const result=runRegression();console.log(`Chart regression: ${result.passed}/${result.total} passed; report verification/regression.json`);if(result.failed)process.exitCode=1;}
module.exports={runRegression,differences};
