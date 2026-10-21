/* Counts are unweighted occurrences, never calibrated physical energy. */
const WX_MODES=freezeRules({
  'stems-main-qi':{name:'天干＋地支本气',description:'四个天干和四个地支本气各计1次，共8次；原有分析采用此口径'},
  'stems-only':{name:'仅天干',description:'四个明透天干各计1次，共4次'},
  'stems-all-hidden':{name:'天干＋全部藏干',description:'四个天干及每个藏干各计1次，不按本/中/余气赋权；总数随藏干项数变化'}
});
function assertPillars(pillars){
  if(!Array.isArray(pillars)||pillars.length!==4||pillars.some(p=>!Array.isArray(p)||p.length!==2||!Number.isInteger(p[0])||!Number.isInteger(p[1])||p[0]<0||p[0]>9||p[1]<0||p[1]>11||p[0]%2!==p[1]%2))throw new RangeError('四柱干支参数无效');
}
function countWuXing(pillars,mode='stems-main-qi'){
  assertPillars(pillars);if(!WX_MODES[mode])throw new RangeError('未知五行统计口径');
  const counts=[0,0,0,0,0];
  pillars.forEach(([g,z])=>{
    counts[GAN_WX[g]]++;
    if(mode==='stems-main-qi')counts[GAN_WX[ZHI_HIDDEN[z][0]]]++;
    if(mode==='stems-all-hidden')ZHI_HIDDEN[z].forEach(h=>counts[GAN_WX[h]]++);
  });
  return {mode,...WX_MODES[mode],counts,total:counts.reduce((a,b)=>a+b,0)};
}
function scoreMonthCommand(dayGan,monthZhi,rules=STRENGTH_RULES){
  const day=GAN_WX[dayGan],month=GAN_WX[ZHI_HIDDEN[monthZhi][0]];
  const relation=month===day?'same':month===(day+4)%5?'resource':month===(day+1)%5?'output':month===(day+3)%5?'officer':'wealth';
  return {value:rules.month[relation],relation,monthMainGan:ZHI_HIDDEN[monthZhi][0]};
}
function scoreRoots(pillars,rules=STRENGTH_RULES){
  const day=GAN_WX[pillars[2][0]],resource=(day+4)%5,entries=[];
  pillars.forEach(([,z],pillar)=>ZHI_HIDDEN[z].forEach((g,qi)=>{
    const wx=GAN_WX[g],relation=wx===day?'same':wx===resource?'resource':null;
    if(!relation)return;
    const base=rules.root[relation][qi],bonus=pillar===2?rules.root.dayBonus:pillar===1?rules.root.monthBonus:0;
    entries.push({pillar,zhi:z,hiddenGan:g,qi,relation,base,bonus,value:base+bonus});
  }));
  return {value:entries.reduce((sum,x)=>sum+x.value,0),entries};
}
function scoreMomentum(pillars,rules=STRENGTH_RULES){
  const dg=pillars[2][0],day=GAN_WX[dg],resource=(day+4)%5,entries=[];
  [0,1,3].forEach(pillar=>{
    const gan=pillars[pillar][0],ts=tenGod(dg,gan);
    if(![0,1,8,9].includes(ts))return;
    const wx=[8,9].includes(ts)?resource:day;
    const rooted=pillars.some(([,z])=>ZHI_HIDDEN[z].some(h=>GAN_WX[h]===wx));
    entries.push({pillar,gan,tenGod:ts,rooted,value:rooted?rules.momentum.rooted:rules.momentum.floating});
  });
  return {value:entries.reduce((sum,x)=>sum+x.value,0),entries};
}
function computeStrength(pillars,rules=STRENGTH_RULES){
  assertPillars(pillars);
  const month=scoreMonthCommand(pillars[2][0],pillars[1][1],rules),roots=scoreRoots(pillars,rules),momentum=scoreMomentum(pillars,rules);
  const score=Number((month.value+roots.value+momentum.value).toFixed(8));
  return {rule:rules.id,score,type:classifyStrengthWithRules(score,rules),parts:{month,roots,momentum}};
}
function selectProfileUseGod(base,climate,profile){
  const {balanced,climateElement,climateCandidate}=base;
  if(profile.useStrategy==='climate-first'&&climateElement>=0)return {element:climateElement,reason:'冬夏调候优先，扶抑路径并列',alternatives:[balanced],conflict:balanced!==climateElement};
  if(profile.climatePriority)return {element:climateCandidate,reason:'扶抑与调候综合',alternatives:[balanced],conflict:balanced!==climateCandidate};
  return {element:balanced,reason:profile.focus,alternatives:climateElement>=0?[climateElement]:[],conflict:false};
}
