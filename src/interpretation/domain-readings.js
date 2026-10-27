/** Local readings share the same positional evidence as the synthesis; no extra chart counts. */
function buildDomainReadings(zh){
  const s=buildMingGeSummary(zh),p=buildUsePreferences(zh),nodes=[...s.visible,...s.hidden];
  const pick=gods=>nodes.filter(n=>gods.includes(n.god));
  const wealth=pick([4,5]),output=pick([2,3]),resource=pick([8,9]),officer=pick([6,7]);
  const state=rows=>rows.some(x=>x.id.endsWith('.gan')&&x.rooted)?'明透有根':rows.some(x=>x.id.endsWith('.gan'))?'明透待根':rows.length?'藏支待引':'原局未见';
  const routes=s.candidates.filter(c=>c.evidence.some(n=>[4,5].includes(n.god)));
  const obstacles=s.obstacles.filter(o=>o.evidence.some(n=>[4,5].includes(n.god)));
  const wealthText='财星'+state(wealth)+'，食伤'+state(output)+'。'+(p.strong==='身弱'?'先看印比承接财耗，再看食伤生财的次序。':p.strong==='中和'?'取用沿'+p.neutral.path+'，财星与这一路线合看。':p.strong==='从弱'?'财官食伤顺势合看，印比回扶时复核从势。':'日主可向财官食伤疏泄，财路仍要落实到来源与承接。')+(routes.length?'当前路径：'+routes.map(c=>c.title+'（'+c.state+'）').join('、')+'。':'财源承接待察，先看原局食伤、官印能否衔接。')+(obstacles.length?'关节：'+obstacles.map(o=>o.title+'，'+o.resolution).join('；')+'。':'');
  const careerText='印星'+state(resource)+'，看学习吸收；食伤'+state(output)+'，看表达产出；官杀'+state(officer)+'，看职责与约束。'+(s.paths.length?'提纲承接：'+s.paths.slice(0,2).map(c=>c.title+'（'+c.state+'）').join('、')+'。':'月令'+s.month.god+'，先补明透与根气的承接。')+(s.obstacles.length?'先处理'+s.obstacles[0].title+'：'+s.obstacles[0].detail:'可把吸收、输出、职责连成学习与工作路径。');
  const spouse=pick(zh.gender===1?[4,5]:[6,7]),day=zh.pillars[2][1],main=ZHI_HIDDEN[day][0];
  const model=gzRelationModel({yearGZ:zh.pillars[0],monthGZ:zh.pillars[1],dayGZ:zh.pillars[2],hourGZ:zh.pillars[3]});
  const relations=model.rows.filter(r=>r.lane==='zhi'&&r.members.some(n=>n.column===2)).map(r=>({name:r.name,positions:r.members.map(n=>n.column),labels:r.members.map(n=>n.pillar+'支'+n.char)}));
  const relationText=relations.length?'夫妻宫联动：'+relations.map(r=>r.labels.join('、')+' '+r.name).join('；')+'。合看彼此牵引，冲看节奏调整，刑害破看相处边界与沟通。':'夫妻宫与其他三支未命中当前合冲刑害破规则，继续看星宫承接。';
  const relationEvidence=model.nodes?.filter(n=>n.lane==='zhi'&&relations.some(r=>r.positions.includes(n.column)))||[];
  const palace={id:'pillar.day.hidden.'+main,pillar:2,gan:main,god:tenGod(zh.dg,main),label:'日支'+ZHI[day]+'藏'+GAN[main]+'（夫妻宫本气）'};
  const relationshipText=(zh.gender===1?'以财星观察伴侣星':'以官杀观察伴侣星')+'，'+state(spouse)+'；日支'+ZHI[day]+'为夫妻宫，本气'+SHISHEN_NAME[palace.god]+'。'+relationText;
  const transits=(zh.dy?.dyList||[]).map((d,index)=>({...d,index,text:GAN[d.g]+ZHI[d.z]+'（'+d.age+'–'+d.endAge+'岁）',god:tenGod(zh.dg,d.g),preference:transitPreference(zh,d.g,d.z).kind}));
  const vaults=zh.pillars.flatMap(([,z],i)=>[1,4,7,10].includes(z)?[['年','月','日','时'][i]+'支'+ZHI[z]]:[]);
  const peach=taohuaZhi(zh.pillars[0][1]),peachPositions=zh.pillars.flatMap(([,z],i)=>z===peach?[['年','月','日','时'][i]+'支'+ZHI[z]]:[]);
  return {wealth:{text:wealthText,evidence:[...wealth,...output,...obstacles.flatMap(o=>o.evidence)],sources:['pattern','rescue','root','transit'],notes:['财星明透'+wealth.filter(x=>x.id.endsWith('.gan')).length+'处，藏干'+wealth.filter(x=>x.id.includes('.hidden.')).length+'处。','四库支：'+(vaults.join('、')||'原局未见')+'；结合财星落位与运年引动读。'],transits:transits.filter(d=>[4,5].includes(d.god)||[4,5].includes(tenGod(zh.dg,ZHI_HIDDEN[d.z][0])))},
    career:{text:careerText,evidence:[...resource,...output,...officer],sources:['pattern','rescue','root','transit'],notes:[],transits:transits.slice(0,1)},
    relationship:{text:relationshipText,evidence:[palace,...spouse,...relationEvidence.map(n=>({id:'pillar.'+['year','month','day','hour'][n.column]+'.hidden.'+ZHI_HIDDEN[zh.pillars[n.column][1]][0],pillar:n.column,gan:ZHI_HIDDEN[zh.pillars[n.column][1]][0],label:n.pillar+'支'+n.char,god:tenGod(zh.dg,ZHI_HIDDEN[zh.pillars[n.column][1]][0])}))],relations,sources:['spouse','gods','he','chong','xing','hai','blossom'],notes:['按年支查桃花'+ZHI[peach]+'：'+(peachPositions.join('、')||'原局未见')+'。'],transits:[]}};
}
