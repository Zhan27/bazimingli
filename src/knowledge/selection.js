/** Local deterministic relevance selection, independently implemented; scores are not confidence. */
const KNOWLEDGE_SELECTION_VERSION='1.0.0';
const KNOWLEDGE_DIMENSION_TOPICS=freezeRules([
  ['五行','十神','日主','藏干','用神'],
  ['格局','正官格','七杀格','正印格','食神格','伤官格','从格','通关'],
  ['调候','用神','通关','五行'],
  ['十神','天干相冲','六合','六冲','三刑','六害','地支暗合'],
  ['天乙贵人','文昌贵人','桃花','驿马','华盖','禄神','羊刃'],
  ['纳音','五行'],['十神','日主','比肩','食神','伤官'],
  ['正财','偏财','食神','比肩','劫财','用神'],
  ['正官','七杀','正印','偏印','文昌贵人','食神'],
  ['正财','偏财','正官','七杀','六合','六冲','桃花'],
  ['十神','比肩','劫财','正印','偏印','食神','伤官'],
  ['五行','调候','用神','六冲'],['天乙贵人','天德贵人','月德贵人','比肩','劫财'],
  ['大运','用神','通关','六合','六冲'],['流年','大运','六合','六冲','三刑'],
  ['用神','调候','五行'],['格局','调候','用神','通关','十神','大运'],
  ['格局','调候','用神','六冲','三刑','六害']
]);
function selectEvidenceKnowledge(chart,schoolId,{dimensionIds=Array.from({length:18},(_,i)=>i+1),limit=20}={}){
  assertStudyChart(chart);
  if(!Array.isArray(dimensionIds)||!dimensionIds.length||dimensionIds.length>18||new Set(dimensionIds).size!==dimensionIds.length||dimensionIds.some(id=>!Number.isInteger(id)||id<1||id>18))throw new TypeError('知识选取维度无效');
  if(!Number.isInteger(limit)||limit<1||limit>40)throw new RangeError('知识选取数量须为1至40');
  const profile=getRuleProfile(schoolId),signals=new Map(),add=(title,id)=>{if(!signals.has(title))signals.set(title,new Set());signals.get(title).add(id);};
  for(const [i,p] of chart.pillars.entries()){
    if(i!==2)add(p.tenGod,'pillar.'+p.id);
    for(const h of p.hidden)add(h.tenGod,'hidden.'+p.id);
  }
  const relations=chartStudyFacts(chart).relations;
  const relationTitles={he:'六合',chong:'六冲',xing:'三刑',hai:'六害',po:'地支相破',anhe:'地支暗合',sanhe:'三合'};
  for(const r of relations){
    const title=r.lane==='gan'?(r.kind==='chong'?'天干相冲':null):relationTitles[r.kind];
    if(title)for(const p of r.positions)add(title,'pillar.'+p.pillar);
  }
  const month=chart.pillars[1].hidden[0]?.tenGod,patternGods={'正官格':'正官','七杀格':'七杀','正印格':'正印','食神格':'食神','伤官格':'伤官'};
  const ranked=KNOWLEDGE_ENTRIES.filter(k=>k.schools.includes('all')||k.schools.includes(profile.key)).filter(k=>!Object.hasOwn(patternGods,k.title)||patternGods[k.title]===month).filter(k=>k.title!=='从格'||chart.strength.type==='从弱').map(k=>{
    const dimensions=dimensionIds.filter(id=>KNOWLEDGE_DIMENSION_TOPICS[id-1].includes(k.title)),factIds=[...(signals.get(k.title)||[])].filter(Boolean),reasons=[];
    if(dimensions.length)reasons.push('请求主题：'+dimensions.map(id=>AI_DIM_TITLES[id-1]).join('、'));
    if(factIds.length)reasons.push('命盘实体：'+factIds.join('、'));
    if(patternGods[k.title]===month){reasons.push('月令本气：'+month);factIds.push('hidden.month');}
    if(k.id==='rule.climate'&&dimensions.length===0&&dimensionIds.some(id=>[3,17].includes(id)))reasons.push('调候与扶抑分列');
    if(['rule.hidden-stems','rule.strength'].includes(k.id))reasons.push('基础计算约定');
    const score=dimensions.length*12+factIds.length*2+(reasons.includes('基础计算约定')?4:0)+(k.id==='rule.climate'&&reasons.length?10:0);
    return {...k,selection:{version:KNOWLEDGE_SELECTION_VERSION,reasons,dimensionIds:dimensions,factIds:[...new Set(factIds)],score}};
  }).filter(k=>k.selection.reasons.length).sort((a,b)=>b.selection.score-a.selection.score||a.id.localeCompare(b.id,'en'));
  const chosen=[],take=k=>{if(k&&chosen.length<limit&&!chosen.some(c=>c.id===k.id))chosen.push(k);};
  for(const id of ['rule.hidden-stems','rule.strength'])take(ranked.find(k=>k.id===id));
  // Give each requested topic an opportunity before filling the remaining relevance budget.
  for(const id of [...dimensionIds].sort((a,b)=>a-b))take(ranked.find(k=>k.selection.dimensionIds.includes(id)&&!chosen.some(c=>c.selection.dimensionIds.includes(id))));
  for(const k of ranked)take(k);
  return chosen;
}
