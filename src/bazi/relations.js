/** Existing relation rules and pillar-aware presentation data; no network or DOM. */
// 干支合冲刑害图示
function zhGanZhiMap(zh){
  const gans=[['年',zh.yearGZ[0]],['月',zh.monthGZ[0]],['日',zh.dayGZ[0]],['时',zh.hourGZ[0]]];
  const zhis=[['年',zh.yearGZ[1]],['月',zh.monthGZ[1]],['日',zh.dayGZ[1]],['时',zh.hourGZ[1]]];
  const rels=[];
  const hePairs=[[0,5],[1,6],[2,7],[3,8],[4,9]];
  const heName={0:'甲己合土',1:'乙庚合金',2:'丙辛合水',3:'丁壬合木',4:'戊癸合火'};
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=gans[i][1],b=gans[j][1];
    const p=hePairs.find(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
    if(p) rels.push({t:'天干五合',name:heName[p[0]],from:gans[i][0]+GAN[a],to:gans[j][0]+GAN[b],cls:'he'});
  }
  // 天干四冲
  const ganChong=[[0,6],[1,7],[2,8],[3,9]];
  const ganChongName=[[0,'甲庚相冲'],[1,'乙辛相冲'],[2,'丙壬相冲'],[3,'丁癸相冲']];
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=gans[i][1],b=gans[j][1];
    const p=ganChong.find(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
    if(p) rels.push({t:'天干相冲',name:ganChongName[ganChong.indexOf(p)][1],from:gans[i][0]+GAN[a],to:gans[j][0]+GAN[b],cls:'chong'});
  }
  const zhiHe=[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
  const zhiHeName=['子丑合土','寅亥合木','卯戌合火','辰酉合金','巳申合水','午未合土'];
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=zhis[i][1],b=zhis[j][1];
    const p=zhiHe.findIndex(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
    if(p>=0) rels.push({t:'地支六合',name:zhiHeName[p],from:zhis[i][0]+ZHI[a],to:zhis[j][0]+ZHI[b],cls:'he'});
  }
  const zhiChong=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  const zhiChongName=['子午相冲','丑未相冲','寅申相冲','卯酉相冲','辰戌相冲','巳亥相冲'];
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=zhis[i][1],b=zhis[j][1];
    const p=zhiChong.findIndex(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
    if(p>=0) rels.push({t:'地支六冲',name:zhiChongName[p],from:zhis[i][0]+ZHI[a],to:zhis[j][0]+ZHI[b],cls:'chong'});
  }
  const zhiSanHe=[[[8,0,4],'申子辰合水'],[[11,3,7],'亥卯未合木'],[[2,6,10],'寅午戌合火'],[[5,9,1],'巳酉丑合金']];
  zhiSanHe.forEach(([set,name])=>{
    const present=set.filter(z=>zhis.some(x=>x[1]===z));
    if(present.length>=2) rels.push({t:'地支三合',name:name+(present.length===3?'（三合全）':'（半合）'),from:present.map(z=>ZHI[z]).join(''),to:'',cls:'sanhe'});
  });
  const xings=[[[2,5,8],'寅巳申三刑'],[[1,10,7],'丑戌未三刑'],[[0,3],'子卯相刑']];
  xings.forEach(([set,name])=>{
    const present=set.filter(z=>zhis.some(x=>x[1]===z));
    if(present.length>=2) rels.push({t:'地支相刑',name:name,from:present.map(z=>ZHI[z]).join(''),to:'',cls:'xing'});
  });
  // 自刑(辰辰/午午/酉酉/亥亥 需同支双见)
  const ziXingZhi=[4,6,9,11];
  ziXingZhi.forEach(z=>{
    const hit=zhis.filter(x=>x[1]===z);
    if(hit.length>=2) rels.push({t:'地支自刑',name:ZHI[z]+ZHI[z]+'自刑',from:hit.map(x=>x[0]+ZHI[z]).join('·'),to:'',cls:'xing'});
  });
  const zhiHai=[[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
  const zhiHaiName=['子未相害','丑午相害','寅巳相害','卯辰相害','申亥相害','酉戌相害'];
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=zhis[i][1],b=zhis[j][1];
    const p=zhiHai.findIndex(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
    if(p>=0) rels.push({t:'地支六害',name:zhiHaiName[p],from:zhis[i][0]+ZHI[a],to:zhis[j][0]+ZHI[b],cls:'hai'});
  }
  const zhiPo=[[0,9],[6,3],[2,11],[5,8],[4,1],[10,7]];
  const zhiPoName=['子酉相破','午卯相破','寅亥相破','巳申相破','辰丑相破','戌未相破'];
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=zhis[i][1],b=zhis[j][1];
    const p=zhiPo.findIndex(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
    if(p>=0) rels.push({t:'地支六破',name:zhiPoName[p],from:zhis[i][0]+ZHI[a],to:zhis[j][0]+ZHI[b],cls:'po'});
  }
  // 地支暗合(藏干五合,非六合本气合)
  const anHe=[[0,10],[1,2],[3,8],[5,8],[6,11]];
  const anHeName={0:'子戌暗合(癸戊合)',1:'丑寅暗合(己甲合)',2:'卯申暗合(乙庚合)',3:'巳申暗合(丙辛合)',4:'午亥暗合(丁壬合)'};
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=zhis[i][1],b=zhis[j][1];
    const p=anHe.findIndex(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
    if(p>=0) rels.push({t:'地支暗合',name:anHeName[p],from:zhis[i][0]+ZHI[a],to:zhis[j][0]+ZHI[b],cls:'anhe'});
  }
  return rels;
}

function gzRelationModel(zh,relations=zhGanZhiMap(zh)){
  const pillars=['年','月','日','时'],values=[zh.yearGZ,zh.monthGZ,zh.dayGZ,zh.hourGZ];
  const nodes=['gan','zhi'].flatMap((lane)=>values.map((value,column)=>({
    id:lane+'-'+column,lane,column,pillar:pillars[column],char:(lane==='gan'?GAN:ZHI)[value[lane==='gan'?0:1]]
  })));
  const rows=relations.map((relation,index)=>{
    const lane=relation.t.startsWith('天干')?'gan':'zhi',candidates=nodes.filter(n=>n.lane===lane);
    const explicit=[...(relation.from+'·'+relation.to).matchAll(/([年月日时])([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥])/g)];
    // Group rules have no pillar names; include all occurrences, not just the first matching character.
    const members=candidates.filter(n=>explicit.length?explicit.some(m=>m[1]===n.pillar&&m[2]===n.char):(relation.from+relation.to).includes(n.char));
    return {...relation,id:String(index),lane,members};
  });
  return {nodes,rows};
}
