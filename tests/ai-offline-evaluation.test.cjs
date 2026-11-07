const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {evaluateResponses,createExample}=require('../lib/ai-evaluation.cjs');

test('offline response evaluation keeps per-case contract failures and groups comparable requests',()=>{
  const data=createExample(),before=JSON.stringify(data);
  const report=evaluateResponses(data);
  assert.equal(JSON.stringify(data),before);
  assert.equal(report.inputKind,'synthetic');
  assert.equal(report.summary.total,2);
  assert.equal(report.summary.evaluated,2);
  assert.equal(report.summary.passed,1);
  assert.equal(report.summary.contractPassRate,.5);
  assert.equal(report.cases[1].result.errorCounts.EXPRESSION_ERROR,1);
  assert.equal(report.groups.length,1);
  assert.equal(report.paidRequests,0);
  data.cases[1].promptVersion='another-prompt';
  assert.equal(evaluateResponses(data).groups.length,2);
});

test('partial dimensions use their requested denominator and Markdown and old rules remain separate',()=>{
  const data=createExample(),valid=data.cases[0];
  const body=JSON.parse(valid.text);
  body.dimensions=body.dimensions.slice(0,2);
  valid.text=JSON.stringify(body);
  valid.dimensionIds=[1,2];
  data.cases=[valid,{...valid,id:'old',ruleVersion:'old-rule'},{...valid,id:'markdown',format:'markdown',text:'# reply'}];
  const r=evaluateResponses(data);
  assert.equal(r.cases[0].result.complete,true);
  assert.equal(r.cases[0].result.dimensionCount,2);
  assert.equal(r.cases[1].code,'RULE_VERSION_MISMATCH');
  assert.equal(r.cases[2].status,'unverified');
  assert.equal(r.summary.evaluated,1);
  assert.equal(r.summary.contractPassRate,1);
  assert.equal(r.summary.notEvaluated,2);
  assert.equal(r.groups.length,3);
});

test('reported latency and costs retain missingness and never combine different currencies',()=>{
  const data=createExample(),base=data.cases[0];
  data.cases=[{...base,reportedLatencyMs:100,reportedCost:{amount:.2,currency:'USD'}},
    {...base,id:'second',reportedLatencyMs:300,reportedCost:{amount:2,currency:'CNY'}},
    {...base,id:'missing'}];
  const {metrics}=evaluateResponses(data).summary;
  assert.deepEqual(metrics.latency,{reportedCount:2,missingCount:1,meanMs:200});
  assert.deepEqual(metrics.cost,{reportedCount:2,missingCount:1,totals:[{currency:'CNY',amount:2},{currency:'USD',amount:.2}]});
  const none=evaluateResponses(createExample()).summary.metrics;
  assert.equal(none.latency.meanMs,null);
  assert.deepEqual(none.cost.totals,[]);
});

test('invalid cases are isolated and reports omit raw replies, birth inputs and unknown credentials',()=>{
  const data=createExample(),base=data.cases[0];
  data.cases=[base,{...base,id:'bad-date',input:{date:'2024-02-30'}},
    {...base,id:'bad-ids',dimensionIds:[]},{...base,id:'bad-metrics',reportedLatencyMs:-1}];
  data.apiKey='SYNTHETIC_CREDENTIAL';
  for(const row of data.cases)row.apiKey='SYNTHETIC_CREDENTIAL';
  const report=evaluateResponses(data),serialized=JSON.stringify(report);
  assert.equal(report.summary.passed,1);
  assert.equal(report.summary.notEvaluated,3);
  assert.equal(report.cases[1].code,'INVALID_CHART_INPUT');
  assert.equal(report.cases[2].code,'INVALID_CASE');
  assert.equal(report.cases[3].code,'INVALID_CASE');
  assert.equal(serialized.includes('SYNTHETIC_CREDENTIAL'),false);
  assert.equal(serialized.includes('2024-02-10'),false);
  assert.equal(serialized.includes('conclusion'),false);
});

test('dataset limits and duplicate IDs fail before producing misleading aggregates',()=>{
  const base=createExample();
  for(const value of [null,[],{...base,schemaVersion:'unknown'},{...base,inputKind:'unknown'},
    {...base,cases:[]},{...base,cases:[base.cases[0],base.cases[0]]},
    {...base,cases:Array.from({length:201},(_,i)=>({...base.cases[0],id:'id-'+i}))}]){
    assert.throws(()=>evaluateResponses(value));
  }
});

test('invalid metadata and unexpected JSON fields cannot copy nested response content into a report',()=>{
  const data=createExample(),base=data.cases[0],secret='SYNTHETIC_NESTED_SECRET';
  const text=JSON.parse(base.text);text[secret]='value';
  data.cases=[{...base,text:JSON.stringify(text)},
    {...base,id:'bad-format',format:{apiKey:secret}},
    {...base,id:'bad-dimension',dimensionIds:[{apiKey:secret}]},
    {...base,id:'too-long',text:'x'.repeat(1000001)},
    {...base,id:'unknown-time',input:{date:'2024-02-10',unknownTime:true}}];
  const report=evaluateResponses(data);
  assert.equal(JSON.stringify(report).includes(secret),false);
  assert.equal(report.cases[0].result.errors[0].path,'root');
  assert.equal(report.cases[4].code,'UNKNOWN_BIRTH_TIME');
  assert.equal(report.summary.notEvaluated,4);
});

test('dimension ordering does not split identical evaluation groups',()=>{
  const data=createExample();
  for(const row of data.cases)row.dimensionIds=[1,2];
  data.cases[1].dimensionIds=[2,1];
  assert.equal(evaluateResponses(data).groups.length,1);
});

test('group coverage discloses different charts instead of implying matched model samples',()=>{
  const data=createExample();
  data.cases[1].input={...data.cases[1].input,date:'2024-02-11'};
  const report=evaluateResponses(data);
  assert.equal(report.groups.length,1);
  assert.equal(report.groups[0].chartIds.length,2);
  assert.deepEqual(report.groups[0].caseIds,['valid','truncated']);
});

test('large fault lists keep complete error counts while bounding diagnostic details',()=>{
  const data=createExample(),row=data.cases[0],text=JSON.parse(row.text);
  for(let i=0;i<200;i++)text['unexpected-'+i]=true;
  row.text=JSON.stringify(text);data.cases=[row];
  const report=evaluateResponses(data),result=report.cases[0].result;
  assert.equal(result.errors.length,100);
  assert.equal(result.errorDetailsTruncated,100);
  assert.equal(result.errorCounts.RULE_INCONSISTENCY,200);
  assert.equal(report.summary.errorCounts.RULE_INCONSISTENCY,200);
});

test('checker versions are recorded and incompatible declared knowledge is never silently evaluated',()=>{
  const data=createExample(),base=data.cases[0];
  const missing={...base,id:'missing-knowledge'};delete missing.knowledgeVersion;
  data.cases=[base,{...base,id:'old-knowledge',knowledgeVersion:'old'},missing];
  const report=evaluateResponses(data);
  assert.equal(report.versions.applicationVersion,require('../package.json').version);
  assert.equal(report.versions.knowledgeVersion,base.knowledgeVersion);
  assert.equal(report.cases[1].code,'KNOWLEDGE_VERSION_MISMATCH');
  assert.equal(report.cases[2].knowledgeVersion,null);
  assert.equal(report.groups.length,3);
  assert.equal(report.summary.evaluated,2);
});

test('a generated report cannot be mistaken for response input and evaluated again',()=>{
  const report=evaluateResponses(createExample());
  assert.throws(()=>evaluateResponses(report),/version/);
});

test('CLI accepts Unicode paths, writes an actual report, and refuses to overwrite either input or output',()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'mingli-eval-'));
  try{
    const input=path.join(folder,'合成 输入.json'),output=path.join(folder,'报告.json');
    const cli=path.resolve(__dirname,'../scripts/evaluate-ai-responses.cjs');
    const run=(...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
    assert.equal(run('--example',input).status,0);
    assert.equal(run(input,output).status,0);
    const before=fs.readFileSync(input,'utf8'),report=fs.readFileSync(output,'utf8');
    assert.equal(JSON.parse(report).summary.passed,1);
    assert.equal(run(input,output).status,1);
    assert.equal(fs.readFileSync(output,'utf8'),report);
    assert.equal(run(input,input).status,1);
    assert.equal(fs.readFileSync(input,'utf8'),before);
    const broken=path.join(folder,'无效.json'),unwritten=path.join(folder,'新报告.json');
    fs.writeFileSync(broken,'SYNTHETIC_PARSE_SECRET');
    const failed=run(broken,unwritten);
    assert.equal(failed.status,1);
    assert.equal((failed.stdout+failed.stderr).includes('SYNTHETIC_PARSE_SECRET'),false);
    assert.equal(fs.existsSync(unwritten),false);
  }finally{
    for(const name of ['合成 输入.json','报告.json','无效.json','新报告.json']){const file=path.join(folder,name);if(fs.existsSync(file))fs.unlinkSync(file);}
    fs.rmdirSync(folder);
  }
});
