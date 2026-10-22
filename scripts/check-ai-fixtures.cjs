// Deterministic contract fixtures. Never invokes a model, estimates costs, or measures predictive accuracy.
const fs=require('node:fs'),path=require('node:path');
const {loadEngine,root}=require('../tests/helpers.cjs');
function evaluateFixtures(){
  const fixture=require('../tests/fixtures/ai-evaluation.cases.json'),e=loadEngine();e.context.input=fixture.input;
  e.run(`var chart=calculateChart(input);var base={schemaVersion:AI_CONTRACT_VERSION,chartId:chartFactId(chart),pillars:chart.pillars.map(p=>p.text),dimensions:AI_DIM_CONTRACTS.map(d=>({id:d.id,title:d.title,conclusion:'合成传统文化参考',facts:['pillar.day'],rules:['rule.strength'],explanation:'用于契约检查，不是模型预测结果。',uncertainty:'high',alternatives:['其他解释仍需核对']}))};`);
  const cases=fixture.cases.map(c=>{
    e.run('var value=JSON.parse(JSON.stringify(base));');
    const changes={none:'',pillar:`value.pillars[0]='错误四柱'`,missing:'value.dimensions.pop()',source:`value.dimensions[0].rules=['invented-source']`,wealth:`value.dimensions[0].conclusion='财富100万'`,truncated:''};
    if(!Object.hasOwn(changes,c.change))throw new Error('Unknown fixture');e.run(changes[c.change]);
    const result=e.json(c.change==='truncated'?`evaluateAiResponse('{',chart)`:'evaluateAiResponse(JSON.stringify(value),chart)');
    const matches=result.pass===c.expectedPass&&(!c.expectedError||result.errorCounts[c.expectedError]>0);
    return {id:c.id,expectedPass:c.expectedPass,expectedError:c.expectedError,matches,...result};
  });
  const report={fixtureVersion:fixture.version,ruleVersion:e.run('RULE_VERSION'),promptVersions:e.json('RULE_PROFILES.map(p=>aiPromptVersion(p.id))'),scope:fixture.scope,cases,summary:{cases:cases.length,expectationsMatched:cases.filter(c=>c.matches).length,syntheticFaultCasesRejected:cases.filter(c=>!c.expectedPass&&!c.pass).length,paidRequests:0}};
  fs.writeFileSync(path.join(root,'verification/ai-contract-evaluation.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const report=evaluateFixtures();console.log(JSON.stringify(report.summary));if(report.summary.expectationsMatched!==report.summary.cases)process.exitCode=1;}
module.exports={evaluateFixtures};
