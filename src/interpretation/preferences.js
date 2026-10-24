/* Strength-first presentation and rule scoring. Calendar and profile use-god selection stay unchanged. */
const STRUCTURE_SCORE_VERSION='1.0.0';
function buildUsePreferences(zh){
  const dw=GAN_WX[zh.dg],state=strengthLabel(zh),following=state==='从弱',strong=['身强','身极强'].includes(state);
  const favorable=state==='中和'?[]:following||strong?[(dw+1)%5,(dw+2)%5,(dw+3)%5]:[(dw+4)%5,dw];
  const adverse=state==='中和'?[]:following||strong?[dw,(dw+4)%5]:[(dw+1)%5,(dw+2)%5,(dw+3)%5];
  const balance=zh.profile?.climatePriority?(zh.useGod?.alternatives?.[0]??zh.yongShen):zh.yongShen;
  const note=following?'从弱·观察财官食伤顺势，印比回扶时重看根气':strong?state+'宜抑·财官食伤承接，印比再增需疏泄':state==='中和'?'中和·按提纲、制化与寒暖取用':'身弱宜扶·印比为先，财官食伤看承受';
  const yong=zh.yongShen,climate=zh.tiaoHouWX??-1;
  return {version:STRUCTURE_SCORE_VERSION,strong:state,cong:following,yong,balance,climate,favorable,adverse,
    selectedIsClimate:climate>=0&&yong===climate&&(balance!==yong||zh.profile?.useStrategy==='climate-first'),note};
}
function elementPreference(zh,wx){
  const p=buildUsePreferences(zh);return p.favorable.includes(wx)?1:p.adverse.includes(wx)?-1:0;
}
function transitPreference(zh,g,z){
  const stem=elementPreference(zh,GAN_WX[g]),branch=elementPreference(zh,ZHI_WX[z]);
  return {stem,branch,value:stem+branch,kind:stem*branch<0?'喜忌交杂':stem+branch>0?'喜用':stem+branch<0?'忌神':'平'};
}
function buildStructureScore(zh){
  const p=buildUsePreferences(zh),s=buildMingGeSummary(zh),basis=[];
  // Fixed maxima add to 100. No base bonus, outcome bands, decade bonus or relation-count penalty.
  const add=(id,k,v,max,detail)=>basis.push({id,k,v:Math.round(Math.max(0,Math.min(max,v))),max,detail});
  const favored=p.favorable,shown=zh.pillars.flatMap(([g,z])=>[GAN_WX[g],GAN_WX[ZHI_HIDDEN[z][0]]]);
  const n=shown.filter(w=>favored.includes(w)).length;
  add('balance','扶抑配合',favored.length?30*Math.min(1,n/3):20,30,favored.length?'按'+p.strong+'方向，八字本气见'+n+'位承接；3位达本项上限':'日主中和，本项取20；细分由提纲与制化承接');
  const target=favored.length?favored:[p.balance];
  const visible=s.visible.filter(x=>target.includes(GAN_WX[x.gan])),hidden=zh.pillars.flatMap(([,z])=>ZHI_HIDDEN[z]).filter(g=>target.includes(GAN_WX[g]));
  const rooted=visible.some(x=>x.rooted);
  add('support','喜用透根',rooted?25:visible.length?15:hidden.length?10:0,25,rooted?'扶抑所需五行透干有根':visible.length?'扶抑所需五行已透，支中待根':hidden.length?'扶抑所需五行藏支，待透干承接':'扶抑所需五行原局未见');
  const candidates=s.candidates.map(c=>{const checks=c.checks.filter(x=>x.kind!=='review');return {title:c.title,ratio:checks.length?checks.filter(x=>x.status==='met').length/checks.length:0};}).sort((a,b)=>b.ratio-a.ratio);
  add('pattern','提纲承接',25*(candidates[0]?.ratio||0),25,candidates[0]?'按「'+candidates[0].title+'」的出现、明透、有根条件逐项计分':'月令配合路径待补');
  const relief={透干有根:10,救应受牵:8,透干待根:6,藏干待引:3,原局未见:0};
  // Score the best available route for each obstacle; a constrained route does not cancel another complete route.
  const resolution=s.obstacles.map(o=>Math.max(0,...o.remedies.map(r=>relief[r.state]||0)));
  add('rescue','关节制化',resolution.length?resolution.reduce((a,b)=>a+b,0)/resolution.length:10,10,resolution.length?s.obstacles.map(o=>o.title+'：'+o.resolution).join('；'):'未见当前提纲路径对应的明透阻力');
  const climate=p.climate,cv=s.visible.filter(x=>GAN_WX[x.gan]===climate),ch=zh.pillars.some(([,z])=>ZHI_HIDDEN[z].some(g=>GAN_WX[g]===climate));
  add('climate','寒暖配合',climate<0?10:cv.some(x=>x.rooted)?10:cv.length?6:ch?4:0,10,climate<0?'当前月份无冬夏专项调候':WUXING[climate]+'调候：'+(cv.some(x=>x.rooted)?'透干有根':cv.length?'明透待根':ch?'支中有藏':'原局未见')+(p.adverse.includes(climate)?'；扶抑与调候分看':''));
  const score=basis.reduce((a,b)=>a+b.v,0),geJu=score>=80?'配合较全':score>=60?'已有承接':score>=40?'局部承接':'着重补配';
  return {version:STRUCTURE_SCORE_VERSION,score,geJu,basis,note:p.strong+'；'+s.pattern+'。'+geJu+'，重点看'+basis.filter(x=>x.v<x.max).map(x=>x.k).join('、')+'。'};
}
function formatTermDays(value){return Number.isFinite(Number(value))?Number(value).toFixed(2):'—';}
function buildWuXingFlow(counts){
  const nodes=WUXING.map((name,i)=>{const a=(-90+i*72)*Math.PI/180;return {name,x:280+92*Math.cos(a),y:150+92*Math.sin(a),r:16+Math.min(counts[i],8)*4,count:counts[i]};});
  const edges=['sheng','ke'].flatMap((kind,k)=>nodes.map((a,i)=>{const j=(i+k+1)%5,b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),start=a.r+3,end=b.r+8;return {kind,from:i,to:j,x1:a.x+dx*start/len,y1:a.y+dy*start/len,x2:b.x-dx*end/len,y2:b.y-dy*end/len};}));
  return {nodes,edges};
}
