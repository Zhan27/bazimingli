/** Deterministic reading layer. Does not change calendar, strength, use-god, AI or chart schemas. */
const MING_GE_VERSION='1.0.0';
function buildMingGeSummary(zh){
  assertPillars(zh.pillars);
  const ids=['year','month','day','hour'],labels=['年','月','日','时'],dg=zh.pillars[2][0];
  const hidden=zh.pillars.flatMap(([,z],pillar)=>ZHI_HIDDEN[z].map((g,qi)=>({id:'pillar.'+ids[pillar]+'.hidden.'+g,pillar,gan:g,god:tenGod(dg,g),qi,label:labels[pillar]+'支'+ZHI[z]+'藏'+GAN[g]+(qi===0?'（本气）':'')})));
  // The day stem is the reference, never an extra helper or a competing peer.
  const visible=zh.pillars.flatMap(([g],pillar)=>pillar===2?[]:[{id:'pillar.'+ids[pillar]+'.gan',pillar,gan:g,god:tenGod(dg,g),label:labels[pillar]+'干'+GAN[g],rooted:hidden.some(h=>GAN_WX[h.gan]===GAN_WX[g])}]);
  const nodes=[...visible,...hidden],pick=gods=>nodes.filter(n=>gods.includes(n.god)),exposed=gods=>visible.filter(n=>gods.includes(n.god));
  const main=ZHI_HIDDEN[zh.pillars[1][1]][0],god=tenGod(dg,main),strength=strengthLabel(zh);
  const month={branch:ZHI[zh.pillars[1][1]],gan:GAN[main],god:SHISHEN_NAME[god],exposed:visible.some(n=>n.gan===main),
    candidates:hidden.filter(n=>n.pillar===1).map(n=>({...n,exposed:visible.some(v=>v.gan===n.gan)}))};
  const pattern=god<2?'比劫月令':month.god+'提纲',paths=[],obstacles=[];
  const addPath=(id,title,groups,detail)=>{const evidence=groups.flatMap(pick);if(groups.every(g=>pick(g).length))paths.push({id,title,detail,evidence,state:groups.every(g=>exposed(g).some(n=>n.rooted))?'透干有根':groups.every(g=>exposed(g).length)?'透干待根':'藏干配合'});};
  const addObstacle=(id,title,groups,remedyGroups,detail)=>{
    if(!groups.every(g=>exposed(g).length))return;
    const remedies=remedyGroups.map(g=>{const evidence=pick(g),v=exposed(g);return {gods:g,title:g.map(i=>SHISHEN_NAME[i]).join('／'),evidence,state:v.some(n=>n.rooted)?'透干有根':v.length?'透干待根':evidence.length?'藏干待引':'原局未见'};});
    const resolution=remedies.some(r=>r.state==='透干有根')?'救应有根':remedies.some(r=>r.state==='透干待根')?'透干待根':remedies.some(r=>r.state==='藏干待引')?'藏干待引':'制化待补';
    obstacles.push({id,title,detail,evidence:groups.flatMap(exposed),remedies,resolution});
  };
  if(god===7){
    addPath('officer-resource','官印相生',[[7],[8,9]],'先看印星承接官气，再看日主根气。');
    addPath('wealth-officer','财生官',[[4,5],[7]],'财生官的路径已见，继续核对财官力量与日主承受。');
    addObstacle('officer-output','伤官与官并透',[[3],[7]],[[8,9],[4,5]],'看印制伤、财通关的柱位与力量。');
  }else if([4,5].includes(god)){
    addPath('output-wealth','食伤生财',[[2,3],[4,5]],'表达产出与财星相连，结合身强弱看承受与耗泄。');
    addPath('wealth-officer','财生官',[[4,5],[7]],'查看官星护财与财生官的次序。');
    addObstacle('wealth-peer','比劫与财并透',[[0,1],[4,5]],[[2,3],[7]],'先辨财与比劫的强弱，再看食伤转化或官星约束。');
    if(['身弱','从弱'].includes(strength))addObstacle('wealth-kill','财杀并透、日主偏弱',[[4,5],[6]],[[8,9]],'财生杀进一步耗身，先看印星承接。');
  }else if([8,9].includes(god)){
    addPath('officer-resource','官杀生印',[[6,7],[8,9]],'官杀、印星、日主之间依次核对。');
    if(['身强','身极强'].includes(strength))addPath('resource-output','身印有余、食伤泄气',[[8,9],[2,3]],'食伤作为疏泄路线，仍看印与食伤的轻重。');
    if(['身弱','从弱'].includes(strength))addObstacle('wealth-resource','财印并透、日主偏弱',[[4,5],[8,9]],[[0,1]],'财克印与护印并看，财印位置不可省略。');
  }else if(god===2){
    addPath('food-wealth','食神生财',[[2],[4,5]],'食神与财星之间观察泄秀、生财的承接。');
    addPath('food-kill','食神制杀',[[2],[6]],'制杀路线已见，继续比较身、食、杀的力量。');
    addObstacle('owl-food','枭食并透',[[8],[2]],[[4,5]],'以食神提纲观察偏印制食，再看财星护食。');
  }else if(god===3){
    addPath('output-wealth','伤官生财',[[3],[4,5]],'看才艺表达能否经财星承接。');
    addPath('output-resource','伤官配印',[[3],[8,9]],'必须继续核对伤官强弱、日主强弱与印根。');
    addObstacle('officer-output','伤官与官并透',[[3],[7]],[[8,9],[4,5]],'金水伤官与调候需求另看，不以并见一项直接判破格。');
  }else if(god===6){
    addPath('food-kill','食神制杀',[[2],[6]],'先看食神是否有根，再比制化与日主承受。');
    addPath('kill-resource','杀印相生',[[6],[8,9]],'印化杀是另一条路线，与食制并见时须辨取舍。');
    addObstacle('wealth-kill','财杀并透',[[4,5],[6]],[[2],[8,9]],'看财生杀之后有无制化承接。');
  }else{
    addPath('peer-officer','比劫月令、见官约束',[[0,1],[7]],'建禄月劫从财官食伤等配合另寻作用路线。');
    addPath('peer-output','比劫月令、食伤泄秀',[[0,1],[2,3]],'月令比劫与食伤承接并看。');
    addObstacle('wealth-peer','比劫与财并透',[[0,1],[4,5]],[[2,3],[7]],'比劫有根不等于夺财，须比较财与制化力量。');
  }
  if([6,7].includes(god))addObstacle('mixed-officer','官杀并透',[[6],[7]],[], '取清须核对合去、制去的具体对象，见食伤不直接当作已清。');
  // A visible rooted remedy is only a clue; a simultaneous exposed counterforce remains material.
  for(const o of obstacles){
    for(const r of o.remedies){
      const counter=r.gods.some(g=>[8,9].includes(g))?exposed([4,5]):r.gods.some(g=>[2,3].includes(g))?exposed([8,9]):r.gods.some(g=>[4,5].includes(g))?exposed([0,1]):[];
      if(r.state==='透干有根'&&counter.length){r.state='救应受牵';r.counterEvidence=counter;}
    }
    if(o.resolution==='救应有根'&&!o.remedies.some(r=>r.state==='透干有根'))o.resolution='救应受牵';
  }
  const strongPaths=paths.filter(p=>p.state==='透干有根'),pending=obstacles.filter(o=>o.resolution!=='救应有根');
  let state=obstacles.length?(pending.length?'制化待察':'救应线索'):strongPaths.length?'配合有根':paths.length?'配合藏支':'配合待察';
  if(strongPaths.length&&pending.length)state='配合与阻力并见';
  if(zh.congGe||strength==='从弱')state='从势另论';
  const roots=hidden.filter(n=>GAN_WX[n.gan]===GAN_WX[dg]);
  const balance=zh.profile?.climatePriority?zh.useGod?.alternatives?.[0]??zh.yongShen:zh.yongShen;
  const climate=zh.tiaoHouWX>=0?zh.tiaoHouWX:null;
  const useGod={selected:WUXING[zh.yongShen],balance:WUXING[balance],climate:climate===null?null:WUXING[climate],conflict:climate!==null&&balance!==climate,
    profile:zh.profile?.name||'综合多流派'};
  const relations=gzRelationModel({yearGZ:zh.pillars[0],monthGZ:zh.pillars[1],dayGZ:zh.pillars[2],hourGZ:zh.pillars[3]}).rows.filter(r=>r.lane==='zhi'&&r.members.some(n=>n.column===1));
  const focus=state==='从势另论'?'先复核从势条件与印比根气，再按顺势路线查看行运。':obstacles.length?'先看'+obstacles[0].title+'；'+obstacles[0].detail:paths.length?'先看'+paths[0].title+'；'+paths[0].detail:'先核对月令透藏与日主根气，再察财官食印配合。';
  const transits=(zh.dy?.dyList||[]).map((d,index)=>{
    const points=[{label:'运干'+GAN[d.g],gan:d.g},...ZHI_HIDDEN[d.z].map((gan,i)=>({label:'运支'+ZHI[d.z]+'藏'+GAN[gan]+(i===0?'（本气）':''),gan}))];
    const matching=points.filter(p=>GAN_WX[p.gan]===zh.yongShen);
    const triggered=obstacles.flatMap(o=>o.remedies.filter(r=>r.state!=='透干有根'&&points.some(p=>r.gods.includes(tenGod(dg,p.gan)))).map(r=>o.title+'：见'+r.title));
    return {index,text:GAN[d.g]+ZHI[d.z],age:d.age,endAge:d.endAge,matching:matching.map(p=>p.label),triggered:[...new Set(triggered)]};
  }).filter(d=>d.matching.length||d.triggered.length);
  const headline=GAN[dg]+WUXING[GAN_WX[dg]]+'日主，'+strength+'；'+month.branch+'月'+month.god+'提纲，'+(month.exposed?'本气透干':'本气藏支')+'。'+focus;
  return {version:MING_GE_VERSION,pattern,month,strength,state,headline,focus,visible,hidden,roots,paths,obstacles,relations:relations.map(r=>({name:r.name,positions:r.members.map(n=>n.pillar+n.char)})),useGod,transits,
    sources:['pattern','rescue','climate','root']};
}
