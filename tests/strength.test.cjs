const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');
const e=loadEngine({ui:true});
test('five strength states retain all classification thresholds',()=>{
  assert.deepEqual(e.json('[-2,1.5,1.50001,5.999,6,9.999,10,13.999,14,20].map(classifyStrength)'),['从弱','从弱','身弱','身弱','中和','中和','身强','身强','身极强','身极强']);
});
test('chart, summary and AI prompt retain exact five-state labels',()=>{
  const examples=[['从弱',2024,1,4,0],['身弱',2024,1,3,0],['中和',2024,1,1,4],['身强',2024,1,1,0],['身极强',1907,7,19,4]];
  for(const [state,y,m,d,h] of examples){
    e.context.state=state;
    const result=e.json(`(()=>{
      const z=zhCompute(new Date(${y},${m}-1,${d}),${h},1,'');
      return {label:strengthLabel(z),summary:buildShareText(z,'样本'),prompt:aiBasicInfo(z),chart:zhMingGeCard(z),report:zhAnalysis(z).total,wangshuai:zhWangShuai(z),cai:zhCaiFu(z),ls:zhLiuShen(z).note,contrast:JSON.stringify(zhSchoolContrast(z))};
    })()`);
    for(const key of ['label','summary','prompt','chart','report','wangshuai'])assert.ok(result[key].includes(state),state+' '+key);
    if(state==='中和'){
      for(const key of ['summary','prompt','chart','report','wangshuai','cai','ls','contrast'])assert.equal(/身弱（中和）|身弱宜扶|日主偏弱|日主身弱|身弱财多/.test(result[key]),false,key);
    }
  }
});
