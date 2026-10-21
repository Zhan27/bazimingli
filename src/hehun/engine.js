/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */
const HH_LIUHE={0:1,2:11,3:10,4:9,5:8,6:7};

const HH_CHONG={0:6,1:7,2:8,3:9,4:10,5:11,6:0,7:1,8:2,9:3,10:4,11:5};

const HH_HAI={0:5,5:0,1:6,6:1,2:5,3:4,4:3,5:2,6:1,8:11,11:8,9:10,10:9};

const HH_TRI=[[2,5,8],[1,7,10]];

const HH_GAN_HE_PAIRS=[['甲','己','土'],['乙','庚','金'],['丙','辛','水'],['丁','壬','木'],['戊','癸','火']];

function hhGanHeName(a,b){
  for(const p of HH_GAN_HE_PAIRS){
    if((GAN[a]===p[0]&&GAN[b]===p[1])||(GAN[a]===p[1]&&GAN[b]===p[0])) return p[0]+p[1]+'合'+p[2];
  }
  return '';
}

const HH_NAYIN_WX={'金':3,'木':0,'水':4,'火':1,'土':2};

const HH_ZW_PAIRS=[['taiyang','taiyin','日月辉映'],['ziwei','tianfu','紫府同气'],['wuqu','tanlang','武贪互照'],['lianzhen','tianxiang','廉相相照'],['jumen','taiyang','巨日同明']];

const HH_ZW_GROUPS={qisha:'杀破狼',pojun:'杀破狼',tanlang:'杀破狼',tianji:'机月同梁',taiyin:'机月同梁',tiantong:'机月同梁',tianliang:'机月同梁'};

function hhRel(a,b){
  if(HH_LIUHE[a]===b) return {k:'liuhe',name:'六合',score:12,desc:'两气相合相吸，天然的亲合力，相处融洽打底'};
  if(HH_CHONG[a]===b) return {k:'chong',name:'六冲',score:-10,desc:'对冲之位，气场相撞，聚少离多或观念碰撞，需刻意经营'};
  if(HH_HAI[a]===b) return {k:'hai',name:'六害',score:-6,desc:'暗耗之象，相处中易有细碎摩擦与消耗，忌积怨'};
  const d=Math.abs(a-b);
  if(d===4||d===8) return {k:'he3',name:'三合半合',score:8,desc:'半合有情的拱合之象，气场协调，互助有余'};
  if(HH_TRI.some(t=>t.includes(a)&&t.includes(b))) return {k:'xing',name:'相刑',score:-8,desc:'无恩之刑，越亲近越易挑剔计较，须防翻旧账'};
  return {k:'none',name:'平',score:0,desc:'中性之遇，相处平稳，亲疏多看经营'};
}

const HH_SHISHEN_TXT={
  5:['妻星正位',12,'对方正是命里"正财"——妻星归位，务实默契，是过日子的正缘之象'],
  4:['缘分灵动',6,'对方为我之偏财——情缘灵动鲜活，相处有趣，惟防心思浮动需守定'],
  7:['夫星正位',12,'对方正是命里"正官"——夫星归位，敬重安稳，彼此有名分与担当'],
  6:['强势压迫',-4,'对方为我之七杀——气场强势有压迫感，需学会服软与立规矩'],
  9:['如师如母',8,'对方为我之正印——如师如长般照拂，被照顾感强，温情打底'],
  8:['若即若离',-2,'对方为我之偏印——心思难测若即若离，多沟通少猜心'],
  2:['我方付出',2,'对方为我之食神——我方付出偏多，对方受用，甘之如饴即可'],
  3:['口舌互怼',-6,'对方为我之伤官——聪明外露互怼日常，口舌是非须防过火'],
  0:['平辈之交',4,'对方为我之比肩——朋友式伴侣，平等并肩，同频同行'],
  1:['争夺消耗',-6,'对方为我之劫财——气场相争，财与注意力均易被分耗，先小人后君子']
};

function hhPeiOuStar(zh){ return zh.gender===1?[4,5]:[6,7]; }

function hhTaoHua(z){ return {0:8,4:8,8:8,2:5,6:5,10:5,1:11,5:11,9:11,3:0,7:0,11:0}[z]; }

function hhDeepInsights(z1,z2,n1,n2,aspects){
  const out=[];
  // ① 星宫同位: 配偶星坐夫妻宫 + 透干得地(合婚第一要义)
  const p1=hhPeiOuStar(z1), p2=hhPeiOuStar(z2);
  const d1h=ZHI_HIDDEN[z1.dayGZ[1]]?ZHI_HIDDEN[z1.dayGZ[1]][0]:-1;
  const d2h=ZHI_HIDDEN[z2.dayGZ[1]]?ZHI_HIDDEN[z2.dayGZ[1]][0]:-1;
  const d1t=d1h>=0?tenGod(z1.dg,d1h):-1, d2t=d2h>=0?tenGod(z2.dg,d2h):-1;
  const t1=p1.includes(d1t), t2=p2.includes(d2t);
  const tou1=[z1.yearGZ[0],z1.monthGZ[0],z1.hourGZ[0]].some(g=>p1.includes(tenGod(z1.dg,g)));
  const tou2=[z2.yearGZ[0],z2.monthGZ[0],z2.hourGZ[0]].some(g=>p2.includes(tenGod(z2.dg,g)));
  const nA=esc0(n1||'甲方'), nB=esc0(n2||'乙方');
  let starTxt='';
  starTxt+='<b>'+nA+'</b>（'+(z1.gender===1?'男命·以财星为妻':'女命·以官星为夫')+'）：'+(t1?'配偶星<b>'+SHISHEN_NAME[d1t]+'</b>正坐夫妻宫——<b>星宫同位</b>，正缘归位，命里自有良配之象':'夫妻宫未坐配偶星（坐'+SHISHEN_NAME[d1t]+'），婚缘多靠大运引动')+'；'+(tou1?'且配偶星<b>透干</b>，婚缘根基有力':'配偶星不透干，婚缘待流年引动');
  starTxt+='。'+'<b>'+nB+'</b>（'+(z2.gender===1?'男命·以财星为妻':'女命·以官星为夫')+'）：'+(t2?'配偶星<b>'+SHISHEN_NAME[d2t]+'</b>正坐夫妻宫——<b>星宫同位</b>，正缘归位，命里自有良配之象':'夫妻宫未坐配偶星（坐'+SHISHEN_NAME[d2t]+'），婚缘多靠大运引动')+'；'+(tou2?'且配偶星<b>透干</b>，婚缘根基有力':'配偶星不透干，婚缘待流年引动');
  const starScore=(t1?3:0)+(tou1?2:0)+(t2?3:0)+(tou2?2:0);
  out.push({icon:'🔑',title:'缘分密码 · 星宫同位',score:starScore,html:starTxt});
  // ② 阴阳互济
  const y1=GAN_YIN[z1.dg], y2=GAN_YIN[z2.dg];
  const yinYang=y1!==y2;
  out.push({icon:'⚖️',title:'阴阳互济',score:yinYang?2:0,html:'双方日主 <b>'+GAN[z1.dg]+'</b>（'+(y1?'阳':'阴')+'）与 <b>'+GAN[z2.dg]+'</b>（'+(y2?'阳':'阴')+'）——'+(yinYang?'一阴一阳，<b>阴阳相济</b>，刚柔互补，婚姻易得平衡':'同属'+(y1?'阳':'阴')+'，气场同向，相处爽利直白，但易各执己见，需互为镜鉴')});
  // ③ 婚期窗口: 双方婚运(配偶星透干年/桃花年)重叠
  const nowY=new Date().getFullYear();
  const y1arr=[], y2arr=[];
  for(let y=nowY;y<=nowY+9;y++){
    const [g,z]=indexToGZ(((y-4)%60+60)%60);
    if(p1.includes(tenGod(z1.dg,g))||hhTaoHua(z1.yearGZ[1])===z) y1arr.push(y);
    if(p2.includes(tenGod(z2.dg,g))||hhTaoHua(z2.yearGZ[1])===z) y2arr.push(y);
  }
  const overlap=y1arr.filter(y=>y2arr.includes(y));
  out.push({icon:'💍',title:'婚期窗口',score:overlap.length?Math.min(overlap.length,2):0,html:'未来十年双方婚运（配偶星透干 / 桃花年）重叠于：<b>'+(overlap.length?overlap.join('、')+'年':'暂无重叠')+'</b>'+(overlap.length?'——择此窗口订婚成家，天时更利':'——缘分未至强求无益，先把当下处好')+'（'+nA+'旺于'+(y1arr.slice(0,3).join('、')||'无')+'；'+nB+'旺于'+(y2arr.slice(0,3).join('、')||'无')+'）'});
  // ④ 相处处方: 最大合点 + 最大冲点 → 行动建议
  const best=aspects.filter(a=>a.score>0).sort((a,b)=>b.score-a.score)[0];
  const worst=aspects.filter(a=>a.score<0).sort((a,b)=>a.score-b.score)[0];
  let fixTxt='';
  if(best) fixTxt+='你们<b>最合</b>之处在「'+esc0(best.k.replace(/\s*·.*/,''))+'」——<b>'+esc0(best.name)+'</b>（+'+best.score+'）：'+esc0(best.desc)+'。这是感情的根基，<b>多放大它</b>，日常相处就稳。';
  if(worst) fixTxt+='<br>你们<b>最磨</b>之处在「'+esc0(worst.k.replace(/\s*·.*/,''))+'」——<b>'+esc0(worst.name)+'</b>（'+worst.score+'）：'+esc0(worst.desc)+'。这一处宜<b>提前立好边界、避开锋芒</b>，别让小事消耗大感情。';
  if(!best&&!worst) fixTxt='此配无大合亦无大冲，感情全靠日常经营——仪式感、共同目标与定期深度沟通，比任何命理都重要。';
  out.push({icon:'🧭',title:'相处处方',score:0,html:fixTxt});
  return out;
}

function heHunCompute(z1,z2,n1,n2){
  const aspects=[];
  // 1. 年支·根基(两族基调)
  const yr=hhRel(z1.yearGZ[1],z2.yearGZ[1]);
  aspects.push({icon:'🏛️',k:'年支 · 两族根基',name:yr.name,score:yr.score,desc:yr.desc});
  // 2. 月支·成长背景
  const mr=hhRel(z1.monthGZ[1],z2.monthGZ[1]);
  aspects.push({icon:'🏡',k:'月支 · 成长背景',name:mr.name,score:Math.round(mr.score*0.5),desc:mr.desc+'（月支主成长环境与家教底色，合则家庭观相近）'});
  // 3. 日支 · 夫妻宫(日常亲疏)
  const dr=hhRel(z1.dayGZ[1],z2.dayGZ[1]);
  aspects.push({icon:'💞',k:'日支 · 夫妻宫',name:dr.name,score:dr.score,desc:dr.desc+'（日支为夫妻宫，主日常相处质感）'});
  // 4. 时支·子女宫
  const hr=hhRel(z1.hourGZ[1],z2.hourGZ[1]);
  aspects.push({icon:'👶',k:'时支 · 子女宫',name:hr.name,score:Math.round(hr.score*0.5),desc:hr.desc+'（时支主子女与晚运，合则家风传承顺畅）'});
  // 5. 日主天干五合(天地鸳鸯合, 上吉)
  const gh=hhGanHeName(z1.dg,z2.dg);
  if(gh){ aspects.push({icon:'💘',k:'日主 · 天干五合',name:gh,score:10,desc:'双方日主天干'+gh+'——'+gh.slice(2)+'气相合，古称"天地鸳鸯合"，天然互吸、情意暗通，为合婚上吉之象'}); }
  // 6. 年干五合(家族气场)
  const ghY=hhGanHeName(z1.yearGZ[0],z2.yearGZ[0]);
  if(ghY){ aspects.push({icon:'🏮',k:'年干 · 五合',name:ghY,score:5,desc:'双方年干'+ghY+'——两族祖辈气场相合，家世交融少隔阂'}); }
  // 7. 纳音年命
  const nyN1=nayinOf(z1.yearGZ[0],z1.yearGZ[1]), nyN2=nayinOf(z2.yearGZ[0],z2.yearGZ[1]);
  const ny1=HH_NAYIN_WX[nyN1.slice(-1)], ny2=HH_NAYIN_WX[nyN2.slice(-1)];
  let nyScore=0,nyName='',nyDesc='';
  if(ny1===ny2){ nyScore=3; nyName='纳音比和'; nyDesc='双方年命纳音同为'+WUXING[ny1]+'（'+nyN1+' / '+nyN2+'），同类相安，根基平稳'; }
  else if((ny1+1)%5===ny2||(ny2+1)%5===ny1){ nyScore=6; nyName='纳音相生'; nyDesc='双方年命纳音相生（'+nyN1+' / '+nyN2+'），五行流通，祖上气场相济'; }
  else { nyScore=-6; nyName='纳音相克'; nyDesc='双方年命纳音相克（'+nyN1+' / '+nyN2+'），性格底色有张力，日久磨合自化'; }
  aspects.push({icon:'🎵',k:'纳音 · 年命',name:nyName,score:nyScore,desc:nyDesc});
  // 8. 日主互看(双向)
  const t12=tenGod(z1.dg,z2.dg), t21=tenGod(z2.dg,z1.dg);
  const g1=parseInt(z1.gender)===1, g2=parseInt(z2.gender)===1;
  const fixTxt=(t,otherIsMale)=>{
    const p=HH_SHISHEN_TXT[t];
    let name=p[0],score=p[1],desc=p[2];
    if(!otherIsMale&&t===5){name='对方为我之正财';desc='对方日主为我之正财——于男命为妻星正位之象（若双方皆女，则取"务实互补"之意解读）';score=8;}
    if(otherIsMale&&t===5){name='对方为我之正财';desc='对方日主为我之正财——财为我克，相处中我方主导经济与节奏，亦主有情';score=6;}
    if(!otherIsMale&&t===7){name='对方为我之正官';desc='对方日主为我之正官——官为管束，对方对我有规范约束力（若双方皆女，则取"互相成就"之意解读）';score=6;}
    if(otherIsMale&&t===7){name='夫星正位';desc='对方日主为我之正官——于女命为夫星正位之象，敬重安稳';score=12;}
    return {name,score,desc};
  };
  const f12=fixTxt(t12,g2), f21=fixTxt(t21,g1);
  aspects.push({icon:'⚖️',k:'日主互看（'+(n1||'甲')+' → '+(n2||'乙')+'）',name:f12.name,score:Math.round(f12.score*0.5),desc:f12.desc});
  aspects.push({icon:'⚖️',k:'日主互看（'+(n2||'乙')+' → '+(n1||'甲')+'）',name:f21.name,score:Math.round(f21.score*0.5),desc:f21.desc});
  // 9. 用神互补
  let bu=0,buDesc=[];
  if(z1.yongShen!==undefined&&(z2.wxCount[z1.yongShen]||0)>=2){bu+=9;buDesc.push((n1||'甲方')+'之用神('+WUXING[z1.yongShen]+')在'+(n2||'乙方')+'命中成势，对方补我之所需');}
  if(z2.yongShen!==undefined&&(z1.wxCount[z2.yongShen]||0)>=2){bu+=9;buDesc.push((n2||'乙方')+'之用神('+WUXING[z2.yongShen]+')在'+(n1||'甲方')+'命中成势，对方补其之所需');}
  if(z1.yongShen!==undefined&&z2.wxCount&&(z2.wxCount[(z1.yongShen+2)%5]||0)>=3){bu-=5;buDesc.push('注意：'+(n2||'乙方')+'命中最旺之五行克'+(n1||'甲')+'之用神，能量上互有牵制');}
  aspects.push({icon:'🔋',k:'用神 · 能量互补',name:bu>0?'互补有助':bu<0?'互有牵制':'中性',score:bu,desc:buDesc.join('；')||'双方五行配置互无特别增益或损耗，相处平实'});
  // 10. 五行补缺
  const lack1=z1.wxCount.map((v,i)=>v===0?i:-1).filter(i=>i>=0);
  const lack2=z2.wxCount.map((v,i)=>v===0?i:-1).filter(i=>i>=0);
  let lack=0,lackDesc=[];
  lack1.forEach(w=>{if((z2.wxCount[w]||0)>=2){lack+=5;lackDesc.push((n1||'甲方')+'缺'+WUXING[w]+'而'+(n2||'乙方')+'有之');}});
  lack2.forEach(w=>{if((z1.wxCount[w]||0)>=2){lack+=5;lackDesc.push((n2||'乙方')+'缺'+WUXING[w]+'而'+(n1||'甲方')+'有之');}});
  if(lackDesc.length) aspects.push({icon:'🧩',k:'五行 · 补缺',name:'互补长短',score:Math.min(lack,10),desc:lackDesc.join('；')+'——五行互补，在一起后气场更完整'});
  // 11. 九星命卦配宫(八宅合婚)
  const g1gua=getMingGua(z1.date.getFullYear(),z1.gender).replace(/\(.*?\)/,'');
  const g2gua=getMingGua(z2.date.getFullYear(),z2.gender).replace(/\(.*?\)/,'');
  const east1=['坎卦','离卦','震卦','巽卦'].includes(g1gua), east2=['坎卦','离卦','震卦','巽卦'].includes(g2gua);
  const sameGua=east1===east2;
  aspects.push({icon:'🧿',k:'九星 · 命卦配宫',name:sameGua?'东/西四命相合':'东四×西四相冲',score:sameGua?6:-6,desc:'男方命卦'+g1gua+'、女方命卦'+g2gua+'——'+(sameGua?'同属'+(east1?'东':'西')+'四命，气场同频，宅运相合':'一东一西，气场有扞格，起居习惯须互相迁就')});
  // 12. 紫微命宫星曜
  const mk1=z1.mingStars&&z1.mingStars[0], mk2=z2.mingStars&&z2.mingStars[0];
  const m1=mk1?ZW_STARS[mk1].name:'', m2=mk2?ZW_STARS[mk2].name:'';
  let zwScore=0,zwName='中平',zwDesc='';
  if(mk1&&mk2){
    const pair=HH_ZW_PAIRS.find(p=>(p[0]===mk1&&p[1]===mk2)||(p[1]===mk1&&p[0]===mk2));
    if(pair){ zwScore=6; zwName=pair[2]; zwDesc='双方命宫主星'+m1+'与'+m2+'——'+pair[2]+'，紫微层面有呼应之象，气场互补'; }
    else if(HH_ZW_GROUPS[mk1]&&HH_ZW_GROUPS[mk1]===HH_ZW_GROUPS[mk2]){ zwScore=4; zwName=HH_ZW_GROUPS[mk1]+'同系'; zwDesc='双方命宫主星'+m1+'与'+m2+'同属'+HH_ZW_GROUPS[mk1]+'星系，性情基调相近，易共鸣'; }
    else { zwName='星曜平配'; zwDesc='双方命宫主星'+m1+'与'+m2+'，无特殊呼应亦无明显相冲，细水长流'; }
  } else { zwDesc='一方命宫主星不现，紫微层佐证有限'; }
  aspects.push({icon:'♈',k:'紫微 · 命宫星曜',name:zwName,score:zwScore,desc:zwDesc});
  // 13. 大运同步
  const age1=new Date().getFullYear()-z1.date.getFullYear();
  const age2=new Date().getFullYear()-z2.date.getFullYear();
  const dy1=z1.dy.dyList.find(d=>age1>=d.age&&age1<=d.endAge);
  const dy2=z2.dy.dyList.find(d=>age2>=d.age&&age2<=d.endAge);
  let dyScore=0,dyTxt='';
  if(dy1&&dy2){
    const dg1=tenGod(z1.dg,dy1.g), dg2=tenGod(z2.dg,dy2.g);
    const good1=(z1.strong&&[2,3,4,5,6,7].includes(dg1))||(!z1.strong&&[0,1,8,9].includes(dg1));
    const good2=(z2.strong&&[2,3,4,5,6,7].includes(dg2))||(!z2.strong&&[0,1,8,9].includes(dg2));
    if(good1&&good2){ dyScore=4; dyTxt='当前大运同属喜用（'+GAN[dy1.g]+ZHI[dy1.z]+'运 / '+GAN[dy2.g]+ZHI[dy2.z]+'运），同频顺遂，互相成就'; }
    else if(!good1&&!good2){ dyScore=-3; dyTxt='当前大运同在低谷（'+GAN[dy1.g]+ZHI[dy1.z]+'运 / '+GAN[dy2.g]+ZHI[dy2.z]+'运），共渡时艰，相扶更贵'; }
    else dyTxt='大运节奏一升一平，错位期需多体谅（'+GAN[dy1.g]+ZHI[dy1.z]+'运 / '+GAN[dy2.g]+ZHI[dy2.z]+'运）';
  } else dyTxt='大运数据不全，暂不作同步评估';
  aspects.push({icon:'🛤️',k:'大运 · 行运同步',name:dyScore===4?'同频顺遂':dyScore===-3?'共渡低谷':'节奏错位',score:dyScore,desc:dyTxt});
  // 14. 调候气候互补(出生地地气补对方调候之需)
  let thScore=0,thDesc=[];
  if(z1.tiaoHouWX>=0&&z2.placeWx===z1.tiaoHouWX){ thScore+=4; thDesc.push((n2||'乙方')+'出生地('+WUXING[z2.placeWx]+'地)正补'+(n1||'甲方')+'调候之需（'+(z1.tiaoHouWX===1?'冬寒需火暖':'夏燥需水润')+'）'); }
  if(z2.tiaoHouWX>=0&&z1.placeWx===z2.tiaoHouWX){ thScore+=4; thDesc.push((n1||'甲方')+'出生地('+WUXING[z1.placeWx]+'地)正补'+(n2||'乙方')+'调候之需（'+(z2.tiaoHouWX===1?'冬寒需火暖':'夏燥需水润')+'）'); }
  if(thScore>0) aspects.push({icon:'🌤️',k:'调候 · 气候互补',name:'地气相济',score:thScore,desc:thDesc.join('；')+'——出生地气候恰可调和对方命局寒暖，同居生活气场舒坦'});
  // 评分
  let score=60;
  aspects.forEach(a=>{score+=a.score;});
  score=Math.max(30,Math.min(95,Math.round(score)));
  const highlights=aspects.filter(a=>a.score>=4).map(a=>a.icon+' '+a.k.replace(/\s*·.*/,''));
  const summary=score>=85?'上等之配：合多于冲，能量互济，是彼此成就的一对——择吉成家、同心经营，可期长久':
    score>=70?'中上之配：大处相合、小处有磨，主干稳固——把相冲相害处的沟通机制建好，情分可持续升温':
    score>=55?'中平之配：无大合亦无大冲，缘分平平——感情浓度靠经营，仪式感与共同目标尤重要':
    score>=40?'磨合之配：刑冲之象偏多，气场相撞——若情真，请以"慢"字诀相处，避锋芒、多留白':
    '慎配之参考：刑冲害显著、互补不足——传统合婚观多劝谨慎；若执手，须以极大的包容与边界感为前提';
  // v5.9 深度研判(精而不多)
  const deep=hhDeepInsights(z1,z2,n1,n2,aspects);
  return {score,aspects,summary,highlights,deep};
}

function hhDeepText(r){
  if(!r.deep||!r.deep.length) return '';
  return '【深度研判（合婚核心法门，务必优先引用与深化）】\n'+r.deep.map(d=>d.title+'：'+d.html.replace(/<[^>]+>/g,'')).join('\n');
}
