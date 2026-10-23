const KNOWLEDGE_VERSION='1.2.0';
const KNOWLEDGE_ENTRIES=freezeRules([
  {id:'rule.hidden-stems',title:'地支藏干表',book:'应用规则表',chapter:'src/bazi/data.js',original:null,explanation:'按锁定藏干表列出本中余气。',schools:['all'],status:'implementation-verified',source:'tests/calculation-rules.test.cjs'},
  {id:'rule.branch-relations',title:'地支合冲关系',book:'应用规则表',chapter:'src/api/chart.js',original:null,explanation:'六合与六冲关系，解释效果未校准。',schools:['all'],status:'implementation-verified',source:'tests/api.test.cjs'},
  {id:'rule.strength',title:'得令通根得势',book:'应用评分约定',chapter:'src/bazi/scoring.js',original:null,explanation:'沿用应用权重，分类阈值与分项有软件测试。',schools:['combined','balance','image','structure','climate'],status:'implementation-verified',source:'tests/calculation-rules.test.cjs'},
  {id:'rule.climate',title:'冬火夏水与扶抑分歧',book:'传统调候应用约定',chapter:null,original:null,explanation:'保留调候与扶抑两条路径，并列展示冲突，非科学预测。',schools:['combined','climate'],status:'traditional-unverified',source:'src/bazi/profiles.js'},
  ...Object.keys(KB_TERMS).map((title,i)=>{
    const t=termKnowledge(title),source=t.sources[0];
    return {id:'term.'+String(i+1).padStart(3,'0'),title,book:source?source.book:'原项目术语汇编',chapter:source?source.chapter:t.category,original:source?.quote||null,explanation:t.explanation,schools:['all'],status:t.status,source:source?.url||'data/terms.json',sources:t.sources,verificationScope:source?'仅核对所列定义及文献位置；释义为应用整理':null};
  })
]);
function searchKnowledge(query='',school='all'){
  const q=String(query).trim().toLowerCase();if(q.length>200)throw new RangeError('检索词过长');
  return KNOWLEDGE_ENTRIES.filter(k=>(school==='all'||k.schools.includes('all')||k.schools.includes(school))&&(!q||[k.title,k.book,k.chapter,k.explanation].join(' ').toLowerCase().includes(q))).map(k=>({...k}));
}
function knowledgeCitation(id){const k=KNOWLEDGE_ENTRIES.find(x=>x.id===id);return k?{id:k.id,book:k.book,chapter:k.chapter,status:k.status,source:k.source,original:k.original,sources:k.sources||[],verificationScope:k.verificationScope||null}:null;}
