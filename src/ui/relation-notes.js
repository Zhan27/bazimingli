/** Learning annotations only; no changes to chart facts, rule results or AI contracts. */
const GZ_NOTE_SOURCES={
  elements:{label:'《渊海子平·基础第一》论五行生克制化',url:'https://m.gushiwen.cn/guwen/bookv_d94be6a56081.aspx',quote:'木旺得金，方成栋梁。',use:'五行强弱与生克制化'},
  stem:{label:'《滴天髓》庚金',url:'https://zh.wikisource.org/wiki/滴天髓#庚金',quote:'能勝甲兄，輸於乙妹。',use:'庚金与甲木的制克关系'},
  branch:{label:'《滴天髓》地支论',url:'https://zh.wikisource.org/wiki/滴天髓#地支論',quote:'旺者沖衰衰者拔，衰者沖旺旺神發。',use:'地支冲动与旺衰'},
  trine:{label:'《三命通会》卷二·论支元三合',url:'https://zh.wikisource.org/wiki/三命通會/卷二#论支元三合',quote:'若三字缺一则化不成局',use:'三合及成局条件'},
  food:{label:'《三命通会》卷六·论食神',url:'https://zh.wikisource.org/wiki/三命通會/卷六#论食神',quote:'甲生丙为泄气',use:'木生火、食神制杀与生财'},
  talent:{label:'《渊海子平》论伤官',url:'https://zh.wikisource.org/wiki/淵海子平#论伤官',quote:'伤官主人多才艺',use:'才艺取象'},
  self:{label:'《三命通会》卷二·论三刑',url:'https://zh.wikisource.org/wiki/三命通會/卷二#论三刑',quote:'辰见辰自刑',use:'自刑及同类气势太过'},
  xing:{label:'《三命通会》卷二·论三刑',url:'https://zh.wikisource.org/wiki/三命通會/卷二#论三刑',use:'三刑、子卯相刑及制化'},
  stemHe:{label:'《三命通会》卷二·论十干合',url:'https://zh.wikisource.org/wiki/三命通會/卷二#论十干合',use:'天干五合与合化'},
  branchHe:{label:'《三命通会》卷二·论支元六合',url:'https://zh.wikisource.org/wiki/三命通會/卷二#论支元六合',quote:'夫合者，和也',use:'地支六合与联结'},
  hai:{label:'《三命通会》卷二·论六害',url:'https://zh.wikisource.org/wiki/三命通會/卷二#论六害',use:'六害与六合的牵制'},
  po:{label:'本项目·地支六破关系表',url:'https://github.com/Zhan27/bazimingli/blob/main/src/bazi/relations.js',use:'六破配对的实现依据'},
  anhe:{label:'《三命通会》卷二·论十干合',url:'https://zh.wikisource.org/wiki/三命通會/卷二#论十干合',use:'暗合涉及的藏干五合；配对沿用本项目关系表'}
};
function gzRelationNote(chart,row){
  const dg=chart.dayGZ[0],focus=row.members.map(n=>{const g=n.lane==='gan'?GAN.indexOf(n.char):ZHI_HIDDEN[ZHI.indexOf(n.char)][0];return n.pillar+(n.lane==='gan'?'干':'支')+n.char+' · '+(n.lane==='gan'&&n.column===2?'日主':SHISHEN_NAME[tenGod(dg,g)]);}).join('；');
  let summary='',image='',sources=[];
  if(row.cls==='chong'){
    summary=row.lane==='gan'?'两干五行相互制约，重点看强弱、得令与制化。':'两支对冲，牵动支中藏干与根气，重点看旺衰及原有组合的变化。';image='变动、竞争、约束与行动的协调。';sources=row.lane==='gan'?['elements']:['branch'];
    if(row.lane==='gan'&&row.members.some(n=>n.char==='甲')&&row.members.some(n=>n.char==='庚')){summary='庚金制甲木，重点看金木强弱与制化。';sources.push('stem');}
  }else if(row.cls==='he'){
    summary=row.lane==='gan'?'两干形成五合，关注合住、合向及月令支持的合化条件。':'两支形成六合，关注五行联结、合住与藏干的生克。';image='协作、聚合与相互牵连。';sources=[row.lane==='gan'?'stemHe':'branchHe'];
  }else if(row.cls==='sanhe'){
    const target=row.name.match(/合([水木火金])/);summary=(target?'向'+target[1]+'的五行气势联动，':'五行气势联动，')+'关注力量汇聚、耗泄及十神作用。'+(row.name.includes('半合')?'当前为半合，继续看缺少的一支及成局条件。':'三支齐见，继续看月令与制化。');image='表达、协同与力量汇聚。';sources=['trine'];
    if(dg===0&&target?.[1]==='火'){if(row.members.some(n=>n.char==='寅')&&row.members.some(n=>n.char==='午'))summary='寅木与午火联动，关注木生火、火势汇聚和木气耗泄。'+(row.name.includes('半合')?'当前为寅午半合，缺戌。':'寅午戌三支齐见。');image='食伤的表达、才艺与产出；丙火制庚金、生戊土财星的分析路线。';sources.push('food','talent');}
  }else if(row.cls==='xing'){
    const self=row.t==='地支自刑';summary=self?'同支重见，关注同类气势叠加与支中藏干的作用。':'多支相刑，关注参与柱位、藏干牵制与五行制化。';image=self?'反复、牵扯与自我较劲。':'相互牵制、事务反复与协调。';sources=[self&&row.members[0]?.char==='辰'?'self':'xing'];
  }else if(row.cls==='hai'){summary='相害涉及支间牵制及原有合局的干扰，结合参与柱位与藏干查看。';image='配合不畅、隐性牵扯与关系协调。';sources=['hai'];
  }else if(row.cls==='po'){summary='相破关注支间组合的松动与牵连，继续看是否兼有合、冲或刑。';image='合作松动、安排调整与反复。';sources=['po'];
  }else{summary='从两支藏干的五合观察隐性联结，展开藏干继续核对合对。';image='隐性协作、牵连与资源联结。';sources=['anhe'];}
  return {summary,focus,image,sources};
}
function gzNoteCitations(keys){
  return '<details class="gz-citations"><summary>典籍与规则出处</summary>'+keys.map(key=>{const source=GZ_NOTE_SOURCES[key];return `<div class="gz-citation"><a href="${gzRelEscape(source.url)}" target="_blank" rel="noopener noreferrer">${gzRelEscape(source.label)} ↗</a>${source.quote?'<q>'+gzRelEscape(source.quote)+'</q>':''}<small>${gzRelEscape(source.use)}</small></div>`;}).join('')+'</details>';
}
